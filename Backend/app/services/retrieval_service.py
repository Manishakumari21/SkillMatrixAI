import numpy as np
import faiss
from app.core.config import get_settings
from app.services.embedding_service import get_embedding
from app.models.interview_question import InterviewQuestion

settings = get_settings()

_question_bank = None
_faiss_index = None


async def load_question_bank():
    global _question_bank, _faiss_index

    if _question_bank is not None:
        return _question_bank

    questions = []
    embeddings_list = []

    db_questions = await InterviewQuestion.find_all().to_list()

    for q in db_questions:
        combined_text = f"{q.role} {q.topic} {q.difficulty} {q.question_text}"
        embedding = get_embedding(combined_text)
        normalized = embedding / np.linalg.norm(embedding)

        row = {
            "id": q.question_id,
            "role": q.role,
            "topic": q.topic,
            "difficulty": q.difficulty,
            "question_text": q.question_text,
            "embedding": embedding,
        }
        questions.append(row)
        embeddings_list.append(normalized)

    if not embeddings_list:
        _question_bank = []
        _faiss_index = faiss.IndexFlatIP(settings.embedding_dimension)
        return _question_bank

    embeddings_matrix = np.array(embeddings_list).astype("float32")
    dimension = embeddings_matrix.shape[1]

    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings_matrix)

    _question_bank = questions
    _faiss_index = index
    return _question_bank


async def search_questions(role, topic, difficulty, top_k=5):
    await load_question_bank()

    if not _question_bank:
        return []

    query_text = f"{role} {topic} {difficulty} interview question"
    query_embedding = get_embedding(query_text)
    query_normalized = query_embedding / np.linalg.norm(query_embedding)
    query_vector = np.array([query_normalized]).astype("float32")

    actual_k = min(top_k, len(_question_bank))
    scores, indices = _faiss_index.search(query_vector, actual_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        question = _question_bank[idx]
        results.append({
            "id": question["id"],
            "role": question["role"],
            "topic": question["topic"],
            "difficulty": question["difficulty"],
            "question_text": question["question_text"],
            "similarity_score": round(float(score), 3),
        })

    return results


def invalidate_question_cache():
    global _question_bank, _faiss_index
    _question_bank = None
    _faiss_index = None
