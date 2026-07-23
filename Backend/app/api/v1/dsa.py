import json
import subprocess
import tempfile
import os
from pathlib import Path
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.core.config import get_settings
from app.models.dsa_problem import DSAProblem

settings = get_settings()
router = APIRouter(prefix="/dsa", tags=["dsa"])

SUPPORTED_LANGUAGES = [
    "python", "python3", "javascript", "typescript", "java",
    "c", "cpp", "csharp", "go", "rust",
    "kotlin", "swift", "ruby", "scala", "php", "dart",
]

LANGUAGE_CONFIG = {
    "python":    {"ext": ".py",  "cmd": ["python3"], "label": "Python 3"},
    "python3":   {"ext": ".py",  "cmd": ["python3"], "label": "Python 3"},
    "javascript":{"ext": ".js",  "cmd": ["node"], "label": "JavaScript"},
    "typescript":{"ext": ".ts",  "compile": ["npx", "tsc", "--outDir", "/tmp", "{src}"], "cmd": ["node", "{js}"], "label": "TypeScript"},
    "java":      {"ext": ".java","cmd": ["java", "{src_no_ext}"], "compile": ["javac", "{src}"], "label": "Java"},
    "c":         {"ext": ".c",   "compile": ["gcc", "-o", "{bin}", "{src}", "-lm"], "cmd": ["{bin}"], "label": "C"},
    "cpp":       {"ext": ".cpp", "compile": ["g++", "-std=c++17", "-o", "{bin}", "{src}"], "cmd": ["{bin}"], "label": "C++"},
    "csharp":    {"ext": ".cs",  "cmd": ["dotnet-script", "{src}"], "label": "C#"},
    "go":        {"ext": ".go",  "cmd": ["go", "run", "{src}"], "label": "Go"},
    "rust":      {"ext": ".rs",  "compile": ["rustc", "-o", "{bin}", "{src}"], "cmd": ["{bin}"], "label": "Rust"},
    "kotlin":    {"ext": ".kt",  "cmd": ["kotlin", "{src}"], "label": "Kotlin"},
    "swift":     {"ext": ".swift","cmd": ["swift", "{src}"], "label": "Swift"},
    "ruby":      {"ext": ".rb",  "cmd": ["ruby", "{src}"], "label": "Ruby"},
    "scala":     {"ext": ".scala","cmd": ["scala", "{src}"], "label": "Scala"},
    "php":       {"ext": ".php", "cmd": ["php", "{src}"], "label": "PHP"},
    "dart":      {"ext": ".dart","cmd": ["dart", "compile", "exe", "{src}", "-o", "{bin}"], "label": "Dart"},
}

def _check_compiler(lang: str) -> str | None:
    config = LANGUAGE_CONFIG.get(lang)
    if not config:
        return f"Unknown language: {lang}"
    import shutil
    if "compile" in config:
        exe = config["compile"][0]
        if not shutil.which(exe):
            return f"{config['label']} compiler ({exe}) is not installed on this server"
    elif "cmd" in config:
        exe = config["cmd"][0]
        if not shutil.which(exe):
            return f"{config['label']} runtime ({exe}) is not installed on this server"
    return None


@router.get("")
async def list_problems(
    q: str = Query("", description="Search query"),
    category: str = Query("", description="Filter by category"),
    difficulty: str = Query("", description="Filter by difficulty"),
):
    query = {}
    if category:
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    if difficulty:
        query["difficulty"] = difficulty.capitalize()

    if query:
        problems = await DSAProblem.find(query).to_list()
    else:
        problems = await DSAProblem.find_all().to_list()

    if q:
        q_lower = q.lower()
        problems = [
            p for p in problems
            if q_lower in p.title.lower()
            or q_lower in p.description.lower()
            or q_lower in p.category.lower()
            or any(q_lower in t for t in p.tags)
        ]

    result = [
        {
            "id": p.problem_id,
            "title": p.title,
            "description": p.description,
            "category": p.category,
            "difficulty": p.difficulty,
            "tags": p.tags,
            "examples": p.examples,
        }
        for p in problems
    ]

    return {
        "problems": result,
        "total": len(result),
    }


@router.get("/languages")
async def list_languages():
    return {
        "languages": [
            {"id": k, "label": v["label"]}
            for k, v in LANGUAGE_CONFIG.items()
        ]
    }


@router.get("/categories")
async def list_categories():
    problems = await DSAProblem.find_all().to_list()
    cats: dict[str, int] = {}
    for p in problems:
        cat = p.category
        cats[cat] = cats.get(cat, 0) + 1
    return {
        "categories": [{"name": k, "count": v} for k, v in sorted(cats.items())]
    }


@router.get("/{problem_id}")
async def get_problem(problem_id: str):
    p = await DSAProblem.find_one(DSAProblem.problem_id == problem_id)
    if not p:
        return {"error": "Problem not found"}
    return {
        "id": p.problem_id,
        "title": p.title,
        "description": p.description,
        "category": p.category,
        "difficulty": p.difficulty,
        "tags": p.tags,
        "examples": p.examples,
        "hints": p.hints,
        "solution_approach": p.solution_approach,
        "sample_code": p.solutions,
    }


class RunCodeRequest(BaseModel):
    problem_id: str
    code: str
    language: str = "python"


def _wrap_code(code: str, function_name: str, language: str, input_val: str) -> str:
    if language in ("python", "python3"):
        return f"""import sys
{code}
try:
    result = {function_name}({input_val})
    print(repr(result))
except Exception as e:
    print(f"ERROR:{{type(e).__name__}}:{{e}}", file=sys.stderr)
    sys.exit(1)
"""
    elif language == "javascript":
        return f"""{code}
try {{
    const result = {function_name}({input_val});
    console.log(JSON.stringify(result));
}} catch(e) {{
    console.error("ERROR:" + e.constructor.name + ":" + e.message);
    process.exit(1);
}}
"""
    elif language == "typescript":
        return f"""{code}
try {{
    const result = {function_name}({input_val});
    console.log(JSON.stringify(result));
}} catch(e) {{
    console.error("ERROR:" + e.constructor.name + ":" + e.message);
    process.exit(1);
}}
"""
    elif language == "java":
        return f"""{code}

class Main {{
    public static void main(String[] args) {{
        try {{
            Object result = {function_name}({input_val});
            System.out.println(result);
        }} catch (Exception e) {{
            System.err.println("ERROR:" + e.getClass().getSimpleName() + ":" + e.getMessage());
            System.exit(1);
        }}
    }}
}}
"""
    elif language == "c":
        return f"""#include <stdio.h>
#include <stdlib.h>
#include <string.h>
{code}

int main() {{
    char* result = {function_name}({input_val});
    printf("%s", result);
    return 0;
}}
"""
    elif language == "cpp":
        return f"""#include <iostream>
#include <string>
#include <sstream>
#include <vector>
{code}

int main() {{
    auto result = {function_name}({input_val});
    std::cout << result;
    return 0;
}}
"""
    elif language == "go":
        return f"""package main

import "fmt"

{code}

func main() {{
    result := {function_name}({input_val})
    fmt.Print(result)
}}
"""
    elif language == "rust":
        return f"""{code}

fn main() {{
    let result = {function_name}({input_val});
    println!("{{:?}}", result);
}}
"""
    elif language == "ruby":
        return f"""{code}

begin
    result = {function_name}({input_val})
    puts result.inspect
rescue => e
    STDERR.puts "ERROR:#{{e.class}}:#{{e.message}}"
    exit 1
end
"""
    elif language == "php":
        return f"""<?php
{code}

try {{
    $result = {function_name}({input_val});
    echo var_export($result, true);
}} catch (Exception $e) {{
    fwrite(STDERR, "ERROR:" . get_class($e) . ":" . $e->getMessage());
    exit(1);
}}
"""
    elif language in ("kotlin", "scala"):
        return f"""{code}

fun main() {{
    try {{
        val result = {function_name}({input_val})
        println(result)
    }} catch (e: Exception) {{
        System.err.println("ERROR:${{e::class.simpleName}}:${{e.message}}")
        System.exit(1)
    }}
}}
"""
    elif language == "swift":
        return f"""{code}

do {{
    let result = {function_name}({input_val})
    print(result)
}} catch {{
    print("ERROR:\\(type(of: error)):\\(error.localizedDescription)", to: &standardError)
    exit(1)
}}

var standardError = FileHandle.standardError
"""
    else:
        return code


def _exec_test(code: str, test_cases: list[dict], function_name: str, language: str) -> dict:
    passed = 0
    total = len(test_cases)
    errors = []
    results = []
    config = LANGUAGE_CONFIG[language]
    ext = config["ext"]

    for i, tc in enumerate(test_cases):
        input_val = tc.get("input", "")
        expected = tc.get("output", "")

        src_path = None
        bin_path = None
        try:
            full_code = _wrap_code(code, function_name, language, input_val)

            if language in ("python", "python3"):
                src_path = tempfile.NamedTemporaryFile(mode="w", suffix=ext, delete=False).name
                with open(src_path, "w") as f:
                    f.write(full_code)
                proc = subprocess.run(
                    ["python3", src_path],
                    capture_output=True, text=True, timeout=settings.dsa_execution_timeout,
                )

            elif language == "java":
                src_path = tempfile.NamedTemporaryFile(mode="w", suffix=".java", delete=False, dir="/tmp").name
                with open(src_path, "w") as f:
                    f.write(full_code)
                compile_proc = subprocess.run(
                    ["javac", src_path],
                    capture_output=True, text=True, timeout=settings.dsa_compile_timeout,
                )
                if compile_proc.returncode != 0:
                    err = compile_proc.stderr.strip().split("\n")[-1] if compile_proc.stderr else "Compilation error"
                    errors.append({"test_case": i + 1, "error": err})
                    results.append({"input": input_val, "expected": expected, "actual": None, "passed": False, "error": err})
                    continue
                class_dir = "/tmp"
                proc = subprocess.run(
                    ["java", "-cp", class_dir, "Main"],
                    capture_output=True, text=True, timeout=settings.dsa_execution_timeout,
                )

            elif language in ("c", "cpp"):
                src_path = tempfile.NamedTemporaryFile(mode="w", suffix=ext, delete=False).name
                bin_path = src_path + ".bin"
                with open(src_path, "w") as f:
                    f.write(full_code)
                compile_cmd = config["compile"][:]
                for idx, arg in enumerate(compile_cmd):
                    compile_cmd[idx] = arg.replace("{src}", src_path).replace("{bin}", bin_path)
                compile_proc = subprocess.run(
                    compile_cmd, capture_output=True, text=True, timeout=settings.dsa_compile_timeout,
                )
                if compile_proc.returncode != 0:
                    err = compile_proc.stderr.strip().split("\n")[-1] if compile_proc.stderr else "Compilation error"
                    errors.append({"test_case": i + 1, "error": err})
                    results.append({"input": input_val, "expected": expected, "actual": None, "passed": False, "error": err})
                    continue
                proc = subprocess.run([bin_path], capture_output=True, text=True, timeout=settings.dsa_execution_timeout)

            elif language in ("rust",):
                src_path = tempfile.NamedTemporaryFile(mode="w", suffix=ext, delete=False).name
                bin_path = src_path + ".bin"
                with open(src_path, "w") as f:
                    f.write(full_code)
                compile_cmd = ["rustc", "-o", bin_path, src_path]
                compile_proc = subprocess.run(
                    compile_cmd, capture_output=True, text=True, timeout=settings.dsa_compile_timeout,
                )
                if compile_proc.returncode != 0:
                    err = compile_proc.stderr.strip().split("\n")[-1] if compile_proc.stderr else "Compilation error"
                    errors.append({"test_case": i + 1, "error": err})
                    results.append({"input": input_val, "expected": expected, "actual": None, "passed": False, "error": err})
                    continue
                proc = subprocess.run([bin_path], capture_output=True, text=True, timeout=settings.dsa_execution_timeout)

            elif language == "typescript":
                ts_path = tempfile.NamedTemporaryFile(mode="w", suffix=".ts", delete=False).name
                with open(ts_path, "w") as f:
                    f.write(full_code)
                js_path = ts_path.replace(".ts", ".js")
                compile_proc = subprocess.run(
                    ["npx", "tsc", "--outDir", "/tmp", ts_path],
                    capture_output=True, text=True, timeout=settings.dsa_compile_timeout,
                )
                if compile_proc.returncode != 0:
                    err = compile_proc.stderr.strip().split("\n")[-1] if compile_proc.stderr else "Compilation error"
                    errors.append({"test_case": i + 1, "error": err})
                    results.append({"input": input_val, "expected": expected, "actual": None, "passed": False, "error": err})
                    continue
                proc = subprocess.run(["node", js_path], capture_output=True, text=True, timeout=settings.dsa_execution_timeout)
                src_path = ts_path
                if os.path.exists(js_path):
                    bin_path = js_path

            else:
                src_path = tempfile.NamedTemporaryFile(mode="w", suffix=ext, delete=False).name
                with open(src_path, "w") as f:
                    f.write(full_code)
                cmd = [a.replace("{src}", src_path).replace("{src_no_ext}", os.path.splitext(src_path)[0]) for a in config["cmd"]]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=settings.dsa_execution_timeout)

            if proc.returncode == 0:
                actual = proc.stdout.strip()
                expected_norm = expected.strip().replace(" ", "")
                actual_norm = actual.replace(" ", "")
                is_pass = actual_norm == expected_norm
                if is_pass:
                    passed += 1
                results.append({
                    "input": input_val,
                    "expected": expected,
                    "actual": actual,
                    "passed": is_pass,
                })
            else:
                err = proc.stderr.strip().split("\n")[-1] if proc.stderr else "Runtime error"
                errors.append({"test_case": i + 1, "error": err})
                results.append({
                    "input": input_val,
                    "expected": expected,
                    "actual": None,
                    "passed": False,
                    "error": err,
                })

        except subprocess.TimeoutExpired:
            errors.append({"test_case": i + 1, "error": "Time limit exceeded (5s)"})
            results.append({
                "input": input_val,
                "expected": expected,
                "actual": None,
                "passed": False,
                "error": "Time limit exceeded",
            })
        except Exception as e:
            errors.append({"test_case": i + 1, "error": str(e)})
            results.append({
                "input": input_val,
                "expected": expected,
                "actual": None,
                "passed": False,
                "error": str(e),
            })
        finally:
            if src_path and os.path.exists(src_path):
                os.unlink(src_path)
            if bin_path and os.path.exists(bin_path):
                os.unlink(bin_path)

    percentage = round((passed / total) * 100, 1) if total > 0 else 0
    return {
        "passed": passed,
        "total": total,
        "percentage": percentage,
        "results": results,
        "errors": errors,
    }


@router.post("/run")
async def run_code(payload: RunCodeRequest):
    problem = await DSAProblem.find_one(DSAProblem.problem_id == payload.problem_id)

    if not problem:
        return {"error": "Problem not found"}

    test_cases = problem.examples
    if not test_cases:
        return {"error": "No test cases available"}

    if payload.language not in SUPPORTED_LANGUAGES:
        return {"error": f"Unsupported language: {payload.language}. Supported: {', '.join(SUPPORTED_LANGUAGES)}"}

    missing = _check_compiler(payload.language)
    if missing:
        return {"error": missing}

    function_name = "solution"
    result = _exec_test(payload.code, test_cases, function_name, payload.language)

    suggestion = ""
    if result["percentage"] < 100:
        if result["errors"]:
            suggestion = f"Fix the error in test case {result['errors'][0]['test_case']}: {result['errors'][0]['error']}"
        else:
            suggestion = "Some test cases failed. Check edge cases and verify your logic."

    return {
        **result,
        "suggestion": suggestion,
        "approach": problem.solution_approach,
        "hints": problem.hints,
    }
