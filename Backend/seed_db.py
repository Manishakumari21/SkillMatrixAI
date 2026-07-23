import asyncio
import csv
import json
from pathlib import Path

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.skill import Skill
from app.models.dsa_problem import DSAProblem
from app.models.interview_question import InterviewQuestion
from app.models.learning_resource import LearningResource
from app.models.action_verb import ActionVerb
from app.core.config import get_settings

settings = get_settings()

SKILLS_DATA = [
    ("python", "programming", ["py"]),
    ("java", "programming", []),
    ("javascript", "programming", ["js"]),
    ("typescript", "programming", ["ts"]),
    ("sql", "database", []),
    ("html", "frontend", []),
    ("css", "frontend", []),
    ("react", "frontend", []),
    ("node.js", "backend", ["nodejs", "node"]),
    ("express", "backend", []),
    ("django", "backend", []),
    ("flask", "backend", []),
    ("fastapi", "backend", []),
    ("spring boot", "backend", ["spring"]),
    ("mongodb", "database", []),
    ("mysql", "database", []),
    ("postgresql", "database", ["postgres"]),
    ("redis", "database", []),
    ("docker", "devops", []),
    ("kubernetes", "devops", ["k8s"]),
    ("git", "devops", []),
    ("github", "devops", []),
    ("aws", "cloud", []),
    ("azure", "cloud", []),
    ("gcp", "cloud", ["google cloud"]),
    ("linux", "devops", []),
    ("rest api", "backend", ["rest", "restful"]),
    ("graphql", "backend", []),
    ("machine learning", "data science", ["ml"]),
    ("deep learning", "data science", ["dl"]),
    ("tensorflow", "data science", []),
    ("pytorch", "data science", []),
    ("pandas", "data science", []),
    ("numpy", "data science", []),
    ("data structures", "cs fundamentals", ["ds"]),
    ("algorithms", "cs fundamentals", []),
    ("oop", "cs fundamentals", ["object oriented programming"]),
    ("system design", "architecture", []),
    ("ci/cd", "devops", []),
    ("jenkins", "devops", []),
    ("agile", "methodology", []),
    ("scrum", "methodology", []),
    ("next.js", "frontend", ["nextjs"]),
    ("tailwind css", "frontend", ["tailwind"]),
    ("bootstrap", "frontend", []),
    ("firebase", "backend", []),
    ("postman", "tools", []),
    ("figma", "design", []),
    ("angular", "frontend", []),
    ("vue", "frontend", ["vue.js", "vuejs"]),
    ("svelte", "frontend", []),
    ("php", "programming", []),
    ("c++", "programming", ["cpp"]),
    ("c", "programming", []),
    ("rust", "programming", []),
    ("go", "programming", ["golang"]),
    ("kotlin", "programming", []),
    ("swift", "programming", []),
    ("sass", "frontend", []),
    ("webpack", "devops", []),
    ("babel", "devops", []),
    ("jira", "tools", []),
    ("terraform", "devops", []),
    ("ansible", "devops", []),
    ("openai api", "ai", []),
    ("langchain", "ai", []),
    ("rag", "ai", ["retrieval augmented generation"]),
    ("vector database", "data science", ["vectordb"]),
    ("prompt engineering", "ai", []),
    ("ruby", "programming", []),
    ("scala", "programming", []),
    ("dart", "programming", []),
    ("flutter", "mobile", []),
    ("android", "mobile", []),
    ("ios", "mobile", []),
    ("kafka", "data engineering", []),
    ("spark", "data engineering", []),
    ("airflow", "data engineering", []),
    ("elasticsearch", "data engineering", ["elastic"]),
    ("nginx", "devops", []),
    ("prometheus", "devops", []),
    ("grafana", "devops", []),
    ("gitlab", "devops", []),
    ("bitbucket", "devops", []),
    ("jenkins", "devops", []),
    ("powershell", "devops", []),
    ("bash", "devops", ["shell scripting"]),
    ("vim", "tools", []),
    ("vscode", "tools", []),
    ("intellij", "tools", []),
    ("pycharm", "tools", []),
    ("tableau", "data science", []),
    ("power bi", "data science", []),
    ("excel", "data science", []),
    ("matlab", "data science", []),
    ("r", "programming", []),
    ("sas", "data science", []),
    ("splunk", "devops", []),
    ("datadog", "devops", []),
    ("new relic", "devops", []),
    ("circleci", "devops", []),
    ("travis ci", "devops", []),
    ("heroku", "cloud", []),
    ("netlify", "cloud", []),
    ("vercel", "cloud", []),
    ("cloudflare", "cloud", []),
    ("digitalocean", "cloud", ["do"]),
    ("linode", "cloud", []),
    ("vultr", "cloud", []),
]

LEARNING_RESOURCES_DATA = {
    "python": {"docs": "https://docs.python.org/3/tutorial/", "youtube": "https://www.youtube.com/watch?v=rfscVS0vtbw", "course_url": "https://www.coursera.org/learn/python", "course_name": "Python for Everybody", "course_provider": "University of Michigan (Coursera - Free Audit)", "certificate": True},
    "java": {"docs": "https://dev.java/learn/", "youtube": "https://www.youtube.com/watch?v=goUytZIaEY8", "course_url": "https://www.coursera.org/learn/java-programming", "course_name": "Java Programming and Software Engineering Fundamentals", "course_provider": "Duke University (Coursera - Free Audit)", "certificate": True},
    "javascript": {"docs": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "youtube": "https://www.youtube.com/watch?v=W6NZfD51iP0", "course_url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "course_name": "JavaScript Algorithms and Data Structures", "course_provider": "freeCodeCamp (100% Free + Certificate)", "certificate": True},
    "typescript": {"docs": "https://www.typescriptlang.org/docs/handbook/", "youtube": "https://www.youtube.com/watch?v=BwuLxPH8IDs", "course_url": "https://www.coursera.org/learn/typescript", "course_name": "TypeScript for Beginners", "course_provider": "Microsoft (Coursera - Free Audit)", "certificate": True},
    "react": {"docs": "https://react.dev/learn", "youtube": "https://www.youtube.com/watch?v=LDB4uaJ87e0", "course_url": "https://www.freecodecamp.org/learn/front-end-development-libraries/", "course_name": "Front End Development Libraries", "course_provider": "freeCodeCamp (100% Free + Certificate)", "certificate": True},
    "node.js": {"docs": "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs", "youtube": "https://www.youtube.com/watch?v=TlB_eWDSMt4", "course_url": "https://www.freecodecamp.org/learn/back-end-development-and-apis/", "course_name": "Back End Development and APIs", "course_provider": "freeCodeCamp (100% Free + Certificate)", "certificate": True},
    "express": {"docs": "https://expressjs.com/en/guide/routing.html", "youtube": "https://www.youtube.com/watch?v=CnH3kAXSrmU", "course_url": "https://www.theodinproject.com/paths/nodejs", "course_name": "NodeJS Course", "course_provider": "The Odin Project (100% Free)", "certificate": False},
    "django": {"docs": "https://docs.djangoproject.com/en/stable/intro/tutorial01/", "youtube": "https://www.youtube.com/watch?v=F5mRW0j-Ul4", "course_url": "https://www.coursera.org/learn/django", "course_name": "Django for Everybody", "course_provider": "University of Michigan (Coursera - Free Audit)", "certificate": True},
    "flask": {"docs": "https://flask.palletsprojects.com/en/stable/tutorial/", "youtube": "https://www.youtube.com/watch?v=Z1RJmh_OqeA", "course_url": "https://www.edx.org/learn/python-the-programming-language/massachusetts-institute-of-technology-computational-thinking-and-python-programming", "course_name": "Computational Thinking and Python Programming", "course_provider": "MIT (edX - Free Audit)", "certificate": True},
    "fastapi": {"docs": "https://fastapi.tiangolo.com/tutorial/", "youtube": "https://www.youtube.com/watch?v=0sOvCWFmrtA", "course_url": "https://fastapi.tiangolo.com/tutorial/", "course_name": "FastAPI Official Tutorial", "course_provider": "FastAPI Docs (100% Free)", "certificate": False},
    "sql": {"docs": "https://www.w3schools.com/sql/", "youtube": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "course_url": "https://www.khanacademy.org/computing/computer-programming/sql", "course_name": "Intro to SQL", "course_provider": "Khan Academy (100% Free)", "certificate": False},
    "mongodb": {"docs": "https://www.mongodb.com/docs/manual/tutorial/getting-started/", "youtube": "https://www.youtube.com/watch?v=-56x56UppqQ", "course_url": "https://university.mongodb.com/", "course_name": "MongoDB Basics", "course_provider": "MongoDB University (100% Free + Certificate)", "certificate": True},
    "postgresql": {"docs": "https://www.postgresql.org/docs/current/tutorial.html", "youtube": "https://www.youtube.com/watch?v=qw--VYLpxgc", "course_url": "https://www.coursera.org/learn/postgresql-for-everybody", "course_name": "PostgreSQL for Everybody", "course_provider": "University of Michigan (Coursera - Free Audit)", "certificate": True},
    "docker": {"docs": "https://docs.docker.com/get-started/", "youtube": "https://www.youtube.com/watch?v=fqMOX6JJhGo", "course_url": "https://www.coursera.org/learn/docker-kubernetes-big-data", "course_name": "Docker and Kubernetes", "course_provider": "Coursera (Free Audit)", "certificate": True},
    "kubernetes": {"docs": "https://kubernetes.io/docs/tutorials/", "youtube": "https://www.youtube.com/watch?v=X48VuDVv0do", "course_url": "https://www.edx.org/learn/kubernetes", "course_name": "Introduction to Kubernetes", "course_provider": "The Linux Foundation (edX - Free Audit)", "certificate": True},
    "aws": {"docs": "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/introduction.html", "youtube": "https://www.youtube.com/watch?v=SOTamWNgDKc", "course_url": "https://www.coursera.org/learn/aws-fundamentals", "course_name": "AWS Fundamentals", "course_provider": "Amazon (Coursera - Free Audit)", "certificate": True},
    "git": {"docs": "https://git-scm.com/doc", "youtube": "https://www.youtube.com/watch?v=HVsyility-6I", "course_url": "https://www.freecodecamp.org/news/learn-git-complete-git-workflow-and-commands-beginners-guide-tutorial/", "course_name": "Complete Git Workflow Tutorial", "course_provider": "freeCodeCamp (100% Free)", "certificate": False},
    "machine learning": {"docs": "https://scikit-learn.org/stable/tutorial/", "youtube": "https://www.youtube.com/watch?v=GwIo3gDZCVQ", "course_url": "https://www.coursera.org/learn/machine-learning", "course_name": "Machine Learning Specialization", "course_provider": "Stanford / Andrew Ng (Coursera - Free Audit)", "certificate": True},
    "deep learning": {"docs": "https://pytorch.org/tutorials/", "youtube": "https://www.youtube.com/watch?v=aircAruvnKk", "course_url": "https://www.coursera.org/learn/neural-networks-deep-learning", "course_name": "Neural Networks and Deep Learning", "course_provider": "deeplearning.ai (Coursera - Free Audit)", "certificate": True},
    "tensorflow": {"docs": "https://www.tensorflow.org/tutorials", "youtube": "https://www.youtube.com/watch?v=tpcf61vXfRk", "course_url": "https://www.coursera.org/learn/introduction-tensorflow", "course_name": "Introduction to TensorFlow", "course_provider": "Google / deeplearning.ai (Coursera - Free Audit)", "certificate": True},
    "pytorch": {"docs": "https://pytorch.org/tutorials/", "youtube": "https://www.youtube.com/watch?v=ucnqWcwKwqs", "course_url": "https://pytorch.org/tutorials/", "course_name": "PyTorch Official Tutorials", "course_provider": "Meta / PyTorch (100% Free)", "certificate": False},
    "pandas": {"docs": "https://pandas.pydata.org/docs/getting_started/", "youtube": "https://www.youtube.com/watch?v=vmEHCJofslg", "course_url": "https://www.freecodecamp.org/learn/data-analysis-with-python/", "course_name": "Data Analysis with Python", "course_provider": "freeCodeCamp (100% Free + Certificate)", "certificate": True},
    "numpy": {"docs": "https://numpy.org/doc/stable/user/quickstart.html", "youtube": "https://www.youtube.com/watch?v=QUT1VHiLmmI", "course_url": "https://www.khanacademy.org/computing/computer-programming", "course_name": "Intro to JS: Drawing & Animation", "course_provider": "Khan Academy (100% Free)", "certificate": False},
    "rest api": {"docs": "https://restfulapi.net/", "youtube": "https://www.youtube.com/watch?v=lsMQRaeKNDk", "course_url": "https://www.coursera.org/learn/api-design", "course_name": "API Design with REST", "course_provider": "University of Michigan (Coursera - Free Audit)", "certificate": True},
    "graphql": {"docs": "https://graphql.org/learn/", "youtube": "https://www.youtube.com/watch?v=eIQh02xuVw4", "course_url": "https://www.freecodecamp.org/news/graphql-beginners-guide/", "course_name": "GraphQL for Beginners", "course_provider": "freeCodeCamp (100% Free)", "certificate": False},
    "system design": {"docs": "https://github.com/donnemartin/system-design-primer", "youtube": "https://www.youtube.com/watch?v=U3RkDLtS7uY", "course_url": "https://www.edx.org/learn/system-design", "course_name": "System Design", "course_provider": "University of Alberta (edX - Free Audit)", "certificate": True},
    "data structures": {"docs": "https://www.geeksforgeeks.org/data-structures/", "youtube": "https://www.youtube.com/watch?v=RBSGKlLvoWg", "course_url": "https://www.coursera.org/learn/data-structures", "course_name": "Data Structures", "course_provider": "UC San Diego (Coursera - Free Audit)", "certificate": True},
    "algorithms": {"docs": "https://www.geeksforgeeks.org/fundamentals-of-algorithms/", "youtube": "https://www.youtube.com/watch?v=8hly31xKli0", "course_url": "https://www.coursera.org/learn/algorithms-part1", "course_name": "Algorithms, Part I", "course_provider": "Princeton University (Coursera - Free Audit)", "certificate": True},
    "ci/cd": {"docs": "https://docs.github.com/en/actions", "youtube": "https://www.youtube.com/watch?v=R8_veQiYBjI", "course_url": "https://www.coursera.org/learn/ci-cd", "course_name": "Continuous Integration and Continuous Delivery", "course_provider": "Google (Coursera - Free Audit)", "certificate": True},
    "linux": {"docs": "https://linuxcommand.org/lc3_learning_the_shell.php", "youtube": "https://www.youtube.com/watch?v=sWbUDq4S6Y8", "course_url": "https://www.edx.org/course/introduction-to-linux", "course_name": "Introduction to Linux", "course_provider": "The Linux Foundation (edX - Free Audit)", "certificate": True},
    "next.js": {"docs": "https://nextjs.org/learn", "youtube": "https://www.youtube.com/watch?v=mTz0GXj8NN0", "course_url": "https://nextjs.org/learn", "course_name": "Learn Next.js", "course_provider": "Vercel (100% Free)", "certificate": False},
    "tailwind css": {"docs": "https://tailwindcss.com/docs", "youtube": "https://www.youtube.com/watch?v=dFgzJXj4nOE", "course_url": "https://tailwindcss.com/docs/installation", "course_name": "Tailwind CSS Official Docs", "course_provider": "Tailwind CSS (100% Free)", "certificate": False},
    "firebase": {"docs": "https://firebase.google.com/docs", "youtube": "https://www.youtube.com/watch?v=_I9rfbtSCcQ", "course_url": "https://www.coursera.org/learn/firebase-in-action", "course_name": "Firebase in Action", "course_provider": "Google (Coursera - Free Audit)", "certificate": True},
    "spring boot": {"docs": "https://spring.io/guides", "youtube": "https://www.youtube.com/watch?v=9SGDpanrc8U", "course_url": "https://www.coursera.org/learn/spring-partial-response", "course_name": "Developing with Spring Boot", "course_provider": "University of Alberta (Coursera - Free Audit)", "certificate": True},
    "redis": {"docs": "https://redis.io/docs/", "youtube": "https://www.youtube.com/watch?v=juR1V2Py1yA", "course_url": "https://university.redis.com/", "course_name": "Redis University Courses", "course_provider": "Redis University (100% Free + Certificate)", "certificate": True},
    "azure": {"docs": "https://learn.microsoft.com/en-us/azure/", "youtube": "https://www.youtube.com/watch?v=ITiiMgW-B7Q", "course_url": "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/", "course_name": "Azure Fundamentals", "course_provider": "Microsoft Learn (100% Free + Certificate)", "certificate": True},
    "gcp": {"docs": "https://cloud.google.com/docs", "youtube": "https://www.youtube.com/watch?v=HfJtQ9aN75s", "course_url": "https://www.cloudskillsboost.google/paths", "course_name": "Google Cloud Fundamentals", "course_provider": "Google Cloud Skills Boost (100% Free Tier)", "certificate": True},
    "html": {"docs": "https://developer.mozilla.org/en-US/docs/Learn/HTML", "youtube": "https://www.youtube.com/watch?v=UB1O30fR-EE", "course_url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "course_name": "Responsive Web Design", "course_provider": "freeCodeCamp (100% Free + Certificate)", "certificate": True},
    "css": {"docs": "https://developer.mozilla.org/en-US/docs/Learn/CSS", "youtube": "https://www.youtube.com/watch?v=1PnVorN6Fc8", "course_url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "course_name": "Responsive Web Design", "course_provider": "freeCodeCamp (100% Free + Certificate)", "certificate": True},
    "bootstrap": {"docs": "https://getbootstrap.com/docs/5.3/getting-started/introduction/", "youtube": "https://www.youtube.com/watch?v=4sosXHiUsdg", "course_url": "https://www.freecodecamp.org/learn/front-end-development-libraries/", "course_name": "Front End Development Libraries", "course_provider": "freeCodeCamp (100% Free + Certificate)", "certificate": True},
    "angular": {"docs": "https://angular.dev/tutorial", "youtube": "https://www.youtube.com/watch?v=3dHNOWTI7H8", "course_url": "https://www.coursera.org/learn/angular", "course_name": "Angular Course", "course_provider": "Google (Coursera - Free Audit)", "certificate": True},
    "vue": {"docs": "https://vuejs.org/guide/introduction.html", "youtube": "https://www.youtube.com/watch?v=FXpIoQ_rT_c", "course_url": "https://vuejs.org/tutorial/", "course_name": "Vue.js Tutorial", "course_provider": "Vue.js Official (100% Free)", "certificate": False},
    "svelte": {"docs": "https://svelte.dev/tutorial/svelte/welcome-to-svelte", "youtube": "https://www.youtube.com/watch?v=zojEMeQGGHs", "course_url": "https://svelte.dev/tutorial/svelte/welcome-to-svelte", "course_name": "Svelte Tutorial", "course_provider": "Svelte Official (100% Free)", "certificate": False},
    "php": {"docs": "https://www.php.net/manual/en/tutorial.php", "youtube": "https://www.youtube.com/watch?v=2ee3-csd31Y", "course_url": "https://www.coursera.org/learn/introduction-php", "course_name": "Introduction to PHP", "course_provider": "University of Michigan (Coursera - Free Audit)", "certificate": True},
    "c++": {"docs": "https://learn.microsoft.com/en-us/cpp/cpp/", "youtube": "https://www.youtube.com/watch?v=vLnPwxZdW4Y", "course_url": "https://www.coursera.org/learn/c-plus-plus", "course_name": "C++ For C Programmers", "course_provider": "University of California (Coursera - Free Audit)", "certificate": True},
    "c": {"docs": "https://learn.microsoft.com/en-us/cpp/c-language/", "youtube": "https://www.youtube.com/watch?v=KJgsSFOSQv0", "course_url": "https://www.edx.org/learn/c-programming", "course_name": "Introduction to C Programming", "course_provider": "Harvard University (edX - Free Audit)", "certificate": True},
    "rust": {"docs": "https://doc.rust-lang.org/book/", "youtube": "https://www.youtube.com/watch?v=BpPEoZW5IiY", "course_url": "https://www.coursera.org/learn/rust-programming", "course_name": "Rust Programming", "course_provider": "University of Minnesota (Coursera - Free Audit)", "certificate": True},
    "go": {"docs": "https://go.dev/doc/", "youtube": "https://www.youtube.com/watch?v=8ui30eu056M", "course_url": "https://www.coursera.org/learn/go-programming-language", "course_name": "Programming with Google Go", "course_provider": "University of California (Coursera - Free Audit)", "certificate": True},
    "kotlin": {"docs": "https://kotlinlang.org/docs/home.html", "youtube": "https://www.youtube.com/watch?v=F9UCjDYr7E0", "course_url": "https://www.coursera.org/learn/kotlin", "course_name": "Kotlin for Java Developers", "course_provider": "JetBrains (Coursera - Free Audit)", "certificate": True},
    "swift": {"docs": "https://docs.swift.org/swift-book/", "youtube": "https://www.youtube.com/watch?v=8Xg7E9shq0U", "course_url": "https://www.edx.org/learn/swift-programming", "course_name": "Developing Apps for iOS", "course_provider": "Apple (edX - Free Audit)", "certificate": True},
    "sass": {"docs": "https://sass-lang.com/guide/", "youtube": "https://www.youtube.com/watch?v=_oywuC7sG0I", "course_url": "https://www.sass-lang.com/guide/", "course_name": "Sass Official Guide", "course_provider": "Sass Lang (100% Free)", "certificate": False},
    "webpack": {"docs": "https://webpack.js.org/guides/getting-started/", "youtube": "https://www.youtube.com/watch?v=3Np_IX5KXWw", "course_url": "https://webpack.js.org/guides/getting-started/", "course_name": "Webpack Getting Started", "course_provider": "Webpack Docs (100% Free)", "certificate": False},
    "babel": {"docs": "https://babeljs.io/docs/", "youtube": "https://www.youtube.com/watch?v=HJss8v3ZJ4Q", "course_url": "https://babeljs.io/docs/", "course_name": "Babel Official Docs", "course_provider": "Babel Docs (100% Free)", "certificate": False},
    "postman": {"docs": "https://learning.postman.com/docs/getting-started/overview/", "youtube": "https://www.youtube.com/watch?v=Vywxoc7X9z8", "course_url": "https://learning.postman.com/courses/postman-essentials/", "course_name": "Postman Essentials", "course_provider": "Postman (100% Free)", "certificate": True},
    "figma": {"docs": "https://help.figma.com/hc/en-us", "youtube": "https://www.youtube.com/watch?v=jwCmIBJ8Jtc", "course_url": "https://www.figma.com/resources/learn-design/", "course_name": "Learn Design with Figma", "course_provider": "Figma (100% Free)", "certificate": False},
    "jira": {"docs": "https://support.atlassian.com/jira-service-management-cloud/", "youtube": "https://www.youtube.com/watch?v=0_8nZ51G62A", "course_url": "https://university.atlassian.com/student/collection/1255046-jira-fundamentals", "course_name": "Jira Fundamentals", "course_provider": "Atlassian University (100% Free + Badge)", "certificate": True},
    "terraform": {"docs": "https://developer.hashicorp.com/terraform/docs", "youtube": "https://www.youtube.com/watch?v=SLB_c_ayRMo", "course_url": "https://www.coursera.org/learn/hashicorp-terraform", "course_name": "HashiCorp Terraform Associate", "course_provider": "HashiCorp (Coursera - Free Audit)", "certificate": True},
    "ansible": {"docs": "https://docs.ansible.com/ansible/latest/index.html", "youtube": "https://www.youtube.com/watch?v=wg253tjv8QA", "course_url": "https://www.ansible.com/resources/get-started", "course_name": "Ansible Getting Started", "course_provider": "Red Hat (100% Free)", "certificate": False},
    "openai api": {"docs": "https://platform.openai.com/docs/", "youtube": "https://www.youtube.com/watch?v=2GQF7y2p_1w", "course_url": "https://www.coursera.org/learn/generative-ai-with-llms", "course_name": "Generative AI with LLMs", "course_provider": "deeplearning.ai (Coursera - Free Audit)", "certificate": True},
    "langchain": {"docs": "https://python.langchain.com/docs/get_started/introduction", "youtube": "https://www.youtube.com/watch?v=aywZrzNaA8g", "course_url": "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/", "course_name": "LangChain for LLM Application Development", "course_provider": "deeplearning.ai (100% Free)", "certificate": True},
    "rag": {"docs": "https://docs.aws.amazon.com/sagemaker/latest/dg/jumpstart-foundation-models-customize-rag.html", "youtube": "https://www.youtube.com/watch?v=TjkbeOakSV4", "course_url": "https://www.deeplearning.ai/short-courses/building-and-evaluating-advanced-rag/", "course_name": "Building and Evaluating Advanced RAG", "course_provider": "deeplearning.ai (100% Free)", "certificate": True},
    "vector database": {"docs": "https://www.pinecone.io/learn/vector-database/", "youtube": "https://www.youtube.com/watch?v=9pRr7qWbPXA", "course_url": "https://www.deeplearning.ai/short-courses/building-apps-with-pinecone/", "course_name": "Building Apps with Pinecone", "course_provider": "deeplearning.ai (100% Free)", "certificate": True},
    "prompt engineering": {"docs": "https://platform.openai.com/docs/guides/prompt-engineering", "youtube": "https://www.youtube.com/watch?v=dOxUclqDXVs", "course_url": "https://www.deeplearning.ai/short-courses/prompt-engineering-for-chatgpt/", "course_name": "Prompt Engineering for ChatGPT", "course_provider": "deeplearning.ai (100% Free)", "certificate": True},
}

ACTION_VERBS_DATA = [
    ("achieved", "impact", "high"), ("administered", "leadership", "medium"),
    ("analyzed", "analytical", "medium"), ("automated", "technical", "high"),
    ("built", "technical", "high"), ("collaborated", "teamwork", "medium"),
    ("consolidated", "efficiency", "medium"), ("constructed", "technical", "medium"),
    ("consulted", "leadership", "medium"), ("coordinated", "leadership", "medium"),
    ("created", "technical", "high"), ("decreased", "impact", "high"),
    ("delivered", "impact", "high"), ("demonstrated", "communication", "medium"),
    ("designed", "technical", "high"), ("developed", "technical", "high"),
    ("directed", "leadership", "high"), ("drove", "leadership", "high"),
    ("eliminated", "impact", "high"), ("enabled", "impact", "high"),
    ("engineered", "technical", "high"), ("established", "leadership", "high"),
    ("executed", "leadership", "high"), ("expanded", "impact", "high"),
    ("facilitated", "leadership", "medium"), ("generated", "impact", "high"),
    ("grew", "impact", "high"), ("identified", "analytical", "medium"),
    ("implemented", "technical", "high"), ("improved", "impact", "high"),
    ("increased", "impact", "high"), ("influenced", "leadership", "medium"),
    ("initiated", "leadership", "high"), ("innovated", "technical", "high"),
    ("integrated", "technical", "high"), ("introduced", "leadership", "medium"),
    ("invented", "technical", "high"), ("launched", "leadership", "high"),
    ("led", "leadership", "high"), ("leveraged", "technical", "medium"),
    ("managed", "leadership", "high"), ("maximized", "impact", "high"),
    ("mentored", "leadership", "medium"), ("migrated", "technical", "medium"),
    ("minimized", "impact", "high"), ("modernized", "technical", "high"),
    ("negotiated", "leadership", "medium"), ("optimized", "technical", "high"),
    ("orchestrated", "leadership", "high"), ("organized", "leadership", "medium"),
    ("overhauled", "technical", "high"), ("oversaw", "leadership", "high"),
    ("pioneered", "leadership", "high"), ("planned", "leadership", "medium"),
    ("prioritized", "leadership", "medium"), ("produced", "impact", "medium"),
    ("programmed", "technical", "medium"), ("proposed", "leadership", "medium"),
    ("provided", "teamwork", "medium"), ("reduced", "impact", "high"),
    ("refactored", "technical", "high"), ("restructured", "technical", "high"),
    ("revamped", "technical", "high"), ("saved", "impact", "high"),
    ("secured", "impact", "high"), ("simplified", "impact", "high"),
    ("solved", "technical", "high"), ("standardized", "efficiency", "medium"),
    ("strengthened", "impact", "medium"), ("streamlined", "efficiency", "high"),
    ("structured", "leadership", "medium"), ("supervised", "leadership", "high"),
    ("surpassed", "impact", "high"), ("transformed", "impact", "high"),
    ("unified", "efficiency", "medium"), ("updated", "technical", "low"),
    ("upsold", "impact", "medium"), ("utilized", "technical", "medium"),
    ("validated", "analytical", "medium"), ("architected", "technical", "high"),
    ("debugged", "technical", "medium"), ("deployed", "technical", "high"),
    ("documented", "communication", "medium"), ("estimated", "analytical", "medium"),
    ("evaluated", "analytical", "medium"), ("formulated", "analytical", "high"),
    ("generated", "technical", "medium"), ("hired", "leadership", "high"),
    ("investigated", "analytical", "medium"), ("maintained", "technical", "medium"),
    ("migrated", "technical", "high"), ("modeled", "analytical", "medium"),
    ("negotiated", "leadership", "high"), ("operated", "technical", "low"),
    ("orchestrated", "technical", "high"), ("outlined", "communication", "low"),
    ("performed", "technical", "low"), ("persuaded", "communication", "medium"),
    ("planned", "leadership", "medium"), ("predicted", "analytical", "medium"),
    ("presented", "communication", "high"), ("prevented", "impact", "high"),
    ("prioritized", "leadership", "high"), ("produced", "technical", "medium"),
    ("programmed", "technical", "high"), ("proposed", "leadership", "high"),
    ("protected", "impact", "medium"), ("proved", "analytical", "medium"),
    ("qualified", "analytical", "medium"), ("realized", "impact", "medium"),
    ("recommended", "analytical", "medium"), ("reconciled", "analytical", "medium"),
    ("recruited", "leadership", "medium"), ("redesigned", "technical", "high"),
    ("reduced", "impact", "high"), ("reengineered", "technical", "high"),
    ("replaced", "technical", "medium"), ("resolved", "technical", "high"),
    ("restored", "technical", "medium"), ("revised", "efficiency", "medium"),
    ("scheduled", "leadership", "low"), ("selected", "leadership", "medium"),
    ("simplified", "impact", "high"), ("spearheaded", "leadership", "high"),
    ("specified", "analytical", "medium"), ("standardized", "efficiency", "high"),
    ("steered", "leadership", "high"), ("stimulated", "impact", "medium"),
    ("superseded", "impact", "medium"), ("synthesized", "analytical", "high"),
    ("systematized", "efficiency", "high"), ("targeted", "analytical", "medium"),
    ("taught", "communication", "medium"), ("tested", "technical", "medium"),
    ("trained", "leadership", "medium"), ("troubleshoot", "technical", "high"),
    ("uncated", "analytical", "medium"), ("understood", "communication", "low"),
    ("verified", "analytical", "medium"), ("visualized", "analytical", "medium"),
    ("wrote", "technical", "low"),
]


async def seed():
    from app.models.user import User
    from app.models.resume import Resume
    from app.models.user_progress import UserProgress

    client = AsyncIOMotorClient(settings.mongo_uri)
    database = client[settings.db_name]
    await init_beanie(
        database=database,
        document_models=[
            User, Resume, UserProgress,
            Skill, DSAProblem, InterviewQuestion, LearningResource, ActionVerb,
        ],
    )

    print("Seeding skills...")
    for name, category, aliases in SKILLS_DATA:
        existing = await Skill.find_one(Skill.name == name)
        if not existing:
            await Skill(name=name, category=category, aliases=aliases).insert()
    print(f"  Seeded {len(SKILLS_DATA)} skills")

    print("Seeding learning resources...")
    count = 0
    for skill, res in LEARNING_RESOURCES_DATA.items():
        existing = await LearningResource.find_one(LearningResource.skill == skill)
        if not existing:
            await LearningResource(
                skill=skill,
                docs_url=res["docs"],
                youtube_url=res["youtube"],
                course_url=res["course_url"],
                course_name=res["course_name"],
                course_provider=res["course_provider"],
                certificate=res["certificate"],
            ).insert()
            count += 1
    print(f"  Seeded {count} learning resources")

    print("Seeding action verbs...")
    for verb, category, intensity in ACTION_VERBS_DATA:
        existing = await ActionVerb.find_one(ActionVerb.verb == verb)
        if not existing:
            await ActionVerb(verb=verb, category=category, intensity=intensity).insert()
    print(f"  Seeded {len(ACTION_VERBS_DATA)} action verbs")

    print("Seeding DSA problems...")
    dsa_path = Path(__file__).parent / "app" / "data" / "dsa_problems.json"
    with open(dsa_path) as f:
        problems = json.load(f)
    count = 0
    for p in problems:
        existing = await DSAProblem.find_one(DSAProblem.problem_id == p["id"])
        if not existing:
            await DSAProblem(
                problem_id=p["id"],
                title=p["title"],
                description=p["description"],
                category=p["category"],
                difficulty=p["difficulty"],
                tags=p.get("tags", []),
                examples=p.get("examples", []),
                hints=p.get("hints", []),
                solution_approach=p.get("solution_approach", ""),
                solutions=p.get("sample_code", {}),
            ).insert()
            count += 1
    print(f"  Seeded {count} DSA problems")

    print("Seeding interview questions...")
    csv_path = Path(__file__).parent / "app" / "data" / "question_bank.csv"
    count = 0
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            qid = f"q_{row['id']}"
            existing = await InterviewQuestion.find_one(InterviewQuestion.question_id == qid)
            if not existing:
                await InterviewQuestion(
                    question_id=qid,
                    role=row["role"],
                    topic=row["topic"],
                    difficulty=row["difficulty"],
                    question_text=row["question_text"],
                ).insert()
                count += 1
    print(f"  Seeded {count} interview questions")

    print("\nDone! All data seeded to MongoDB.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
