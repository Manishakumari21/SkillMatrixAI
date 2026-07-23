from sentence_transformers import SentenceTransformer
import numpy as np
from app.core.config import get_settings

settings = get_settings()

_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embedding_model_name)
    return _model
 
def get_embedding(text):
    model = get_model()
    embedding = model.encode(text)
    return embedding

def cosine_similarity(vector_a, vector_b):
    dot_product = np.dot(vector_a, vector_b)
    magnitude_a = np.linalg.norm(vector_a)
    magnitude_b = np.linalg.norm(vector_b)

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)