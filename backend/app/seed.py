"""Seed the database with demo data mirroring src/data/mock.ts.

Run from the backend directory:  python -m app.seed
"""

from datetime import datetime

from app.db.session import Base, SessionLocal, engine
from app.models import (
    Bookmark,
    ChatMessage,
    Lecture,
    Note,
    QuizQuestion,
    TranscriptSegment,
    User,
)

LECTURES = [
    dict(
        id="l1",
        title="Transformer Architecture Explained",
        channel="Machine Learning Mastery",
        video_id="wjZofJX0v4M",
        url="https://youtu.be/wjZofJX0v4M",
        duration=1842,
        added_at=datetime(2026, 8, 12, 10, 0),
        status="ready",
        progress=100,
        thumbnail="https://img.youtube.com/vi/wjZofJX0v4M/hqdefault.jpg",
    ),
    dict(
        id="l2",
        title="Backpropagation & Neural Networks",
        channel="ML Foundations",
        video_id="Ilg3gGewQ5U",
        url="https://youtu.be/Ilg3gGewQ5U",
        duration=2530,
        added_at=datetime(2026, 8, 14, 9, 30),
        status="ready",
        progress=100,
        thumbnail="https://img.youtube.com/vi/Ilg3gGewQ5U/hqdefault.jpg",
    ),
    dict(
        id="l3",
        title="Attention Is All You Need (Paper Walkthrough)",
        channel="AI Papers Weekly",
        video_id="iDulhoQ2pro",
        url="https://youtu.be/iDulhoQ2pro",
        duration=2210,
        added_at=datetime(2026, 8, 16, 18, 45),
        status="processing",
        progress=62,
        thumbnail="https://img.youtube.com/vi/iDulhoQ2pro/hqdefault.jpg",
    ),
    dict(
        id="l4",
        title="Diffusion Models from Scratch",
        channel="GenAI Tutorials",
        video_id="HoKDTa5jHvg",
        url="https://youtu.be/HoKDTa5jHvg",
        duration=3120,
        added_at=datetime(2026, 8, 18, 7, 20),
        status="queued",
        progress=0,
        thumbnail="https://img.youtube.com/vi/HoKDTa5jHvg/hqdefault.jpg",
    ),
]

TRANSCRIPT = [
    (0, "Welcome back everyone. Today we are going to break down the transformer architecture from the ground up."),
    (14, "The transformer was introduced in the landmark paper Attention Is All You Need by Vaswani and colleagues in 2017."),
    (42, "Before transformers, sequence models relied on recurrent neural networks which processed tokens one step at a time."),
    (78, "That sequential processing made RNNs slow to train and hard to parallelize across long sequences."),
    (105, "The key insight of the transformer is the self-attention mechanism which allows every token to directly attend to every other token."),
    (141, "Self-attention computes three vectors per token: a query, a key, and a value."),
    (171, "The query and key determine the relevance between two tokens, and the value carries the actual information."),
    (210, "We take the dot product of the query with all keys, scale by the square root of the dimension, and pass it through a softmax."),
    (254, "This gives us a probability distribution that weights how much each token should influence the current position."),
    (289, "Multiple attention heads run this process in parallel, each focusing on a different aspect of the relationship."),
    (322, "Multi-head attention is followed by a position-wise feed forward network and residual connections with layer normalization."),
    (356, "Residual connections help the gradient flow during training, making very deep transformers trainable."),
    (390, "Positional encodings inject information about the order of tokens since self-attention itself is permutation invariant."),
    (427, "The encoder of the transformer is a stack of these identical layers, producing contextualized representations."),
    (460, "The decoder attends to both the encoder outputs and the previously generated tokens to produce the output."),
    (496, "A masked self-attention layer inside the decoder ensures predictions only depend on past positions."),
    (530, "This masking preserves the auto-regressive property that is essential for language generation."),
    (565, "Training uses masked language modeling or causal language modeling objectives over massive text corpora."),
    (600, "The result is a model that can be pre-trained once and fine-tuned for translation, summarization, and question answering."),
    (643, "That is the core of the transformer architecture that powers modern AI systems today."),
]

MESSAGES = [
    dict(id="m1", lecture_id="l1", role="user", text="What is self-attention and why is it important?",
         timestamp=datetime(2026, 8, 20, 10, 5, 0)),
    dict(id="m2", lecture_id="l1", role="ai",
         text="Self-attention is the core mechanism of the transformer. It lets every token in the sequence directly attend to every other token, computing relevance via queries, keys, and values. This removes the sequential bottleneck of RNNs and enables massive parallelization during training.",
         timestamp=datetime(2026, 8, 20, 10, 5, 2), citations=[{"time": 105}, {"time": 141}]),
    dict(id="m3", lecture_id="l1", role="user", text="How do the query, key, and value vectors work together?",
         timestamp=datetime(2026, 8, 20, 10, 6, 0)),
    dict(id="m4", lecture_id="l1", role="ai",
         text="The query and key pair determines relevance between tokens: the dot product of a query with all keys is scaled by the square root of the dimension and passed through a softmax. That softmax distribution weights how much each token (via its value) contributes to the current position.",
         timestamp=datetime(2026, 8, 20, 10, 6, 3), citations=[{"time": 171}, {"time": 210}]),
]

NOTES = [
    dict(id="n1", title="Transformer cheat sheet",
         content="- Self-attention: Q, K, V vectors per token\n- Scale dot-product by sqrt(d_model)\n- Multi-head runs in parallel\n- Residual + LayerNorm after each sublayer",
         lecture_id="l1", color="#8EF0A3", updated_at=datetime(2026, 8, 13, 9, 0)),
    dict(id="n2", title="Backprop intuition",
         content="Backpropagation is just the chain rule applied efficiently. Compute the gradient of the loss with respect to each weight by moving backward through the graph.",
         lecture_id="l2", color="#9F8FF0", updated_at=datetime(2026, 8, 15, 14, 20)),
    dict(id="n3", title="Exam prep questions",
         content="1. Why does softmax scaling use sqrt(d_k)?\n2. What does masking achieve in the decoder?\n3. How do residual connections help deep training?",
         lecture_id=None, color="#FFB84D", updated_at=datetime(2026, 8, 17, 20, 0)),
]

BOOKMARKS = [
    dict(id="b1", lecture_id="l1",
         quote="Self-attention allows every token to directly attend to every other token.",
         created_at=datetime(2026, 8, 13, 10, 0)),
    dict(id="b2", lecture_id="l1",
         quote="Residual connections help the gradient flow during training, making very deep transformers trainable.",
         created_at=datetime(2026, 8, 14, 11, 30)),
    dict(id="b3", lecture_id="l2",
         quote="Backpropagation is the efficient application of the chain rule to train deep networks.",
         created_at=datetime(2026, 8, 16, 16, 45)),
]

QUIZ = [
    dict(id="q1", lecture_id="l1",
         question="What removes the sequential processing bottleneck of RNNs in transformers?",
         options=["Convolutional layers", "Self-attention", "Long short-term memory", "Feature pyramids"],
         correct_index=1,
         explanation="Self-attention lets every token attend to every other token in parallel, unlike the step-by-step processing of RNNs.",
         source_time=105),
    dict(id="q2", lecture_id="l1",
         question="Which three vectors are computed per token by self-attention?",
         options=["Input, output, hidden", "Query, key, value", "Red, green, blue", "Encoder, decoder, softmax"],
         correct_index=1,
         explanation="Self-attention computes a query, a key, and a value vector for each token.",
         source_time=141),
    dict(id="q3", lecture_id="l1",
         question="Why is the dot product scaled by the square root of the dimension?",
         options=["To inflate the scores", "To avoid extreme softmax values for large dimensions",
                  "To add noise for regularization", "To speed up matrix multiplication"],
         correct_index=1,
         explanation="Scaling by sqrt(d_k) keeps the variance stable so softmax does not saturate for high-dimensional keys.",
         source_time=210),
    dict(id="q4", lecture_id="l1",
         question="What does the masked self-attention inside the decoder ensure?",
         options=["Predictions only depend on past positions", "Faster inference",
                  "Higher resolution outputs", "Lower memory usage"],
         correct_index=0,
         explanation="Masked self-attention preserves the auto-regressive property needed for language generation.",
         source_time=496),
    dict(id="q5", lecture_id="l1",
         question="What do residual connections provide in deep transformers?",
         options=["Better generalization for free", "Smoother gradient flow during training",
                  "Lower inference cost", "Hardware acceleration"],
         correct_index=1,
         explanation="Residual (skip) connections help gradients flow directly through the network, making deep stacks trainable.",
         source_time=356),
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.get(Lecture, "l1"):
            print("Database already seeded - skipping.")
            return

        for row in LECTURES:
            db.add(Lecture(**row))
        db.flush()

        for start, text in TRANSCRIPT:
            db.add(TranscriptSegment(lecture_id="l1", start=start, text=text))
        for row in MESSAGES:
            db.add(ChatMessage(**row))
        for row in NOTES:
            db.add(Note(**row))
        for row in BOOKMARKS:
            db.add(Bookmark(**row))
        for row in QUIZ:
            db.add(QuizQuestion(**row))
        db.add(User(
            email="saad@example.com",
            name="Saad Ahmed",
            avatar="SA",
            join_date="Jan 2026",
            videos_processed=12,
            questions_asked=347,
            streak=14,
            minutes_watched=1280,
        ))
        db.commit()
        print("Seeded lectures, transcript, chat, notes, bookmarks, quiz and user.")


if __name__ == "__main__":
    seed()
