_client = None
_collection = None


def _get_client():
    global _client
    if _client is None:
        import chromadb
        _client = chromadb.PersistentClient(path="./chromadb_data")
    return _client


def _get_collection():
    global _collection
    if _collection is None:
        _collection = _get_client().get_or_create_collection(name="news_embeddings")
    return _collection


class _LazyCollection:
    def __getattr__(self, name):
        return getattr(_get_collection(), name)

    def __setattr__(self, name, value):
        return setattr(_get_collection(), name, value)


collection = _LazyCollection()