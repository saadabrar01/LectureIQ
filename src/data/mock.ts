export interface Lecture {
  id: string;
  title: string;
  channel: string;
  videoId: string;
  url: string;
  duration: number;
  addedAt: Date;
  status: 'processing' | 'ready' | 'error' | 'queued';
  progress: number;
  thumbnail: string;
}

export interface TranscriptSegment {
  start: number;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  citations?: { time: number }[];
  saved?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lectureId?: string;
  lectureTitle?: string;
  color: string;
  updatedAt: Date;
}

export interface Bookmark {
  id: string;
  lectureId: string;
  lectureTitle: string;
  quote: string;
  createdAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceTime: number;
}

export const lectures: Lecture[] = [
  {
    id: 'l1',
    title: 'Transformer Architecture Explained',
    channel: 'Machine Learning Mastery',
    videoId: 'wjZofJX0v4M',
    url: 'https://youtu.be/wjZofJX0v4M',
    duration: 1842,
    addedAt: new Date('2026-08-12T10:00:00'),
    status: 'ready',
    progress: 100,
    thumbnail: 'https://img.youtube.com/vi/wjZofJX0v4M/hqdefault.jpg',
  },
  {
    id: 'l2',
    title: 'Backpropagation & Neural Networks',
    channel: 'ML Foundations',
    videoId: 'Ilg3gGewQ5U',
    url: 'https://youtu.be/Ilg3gGewQ5U',
    duration: 2530,
    addedAt: new Date('2026-08-14T09:30:00'),
    status: 'ready',
    progress: 100,
    thumbnail: 'https://img.youtube.com/vi/Ilg3gGewQ5U/hqdefault.jpg',
  },
  {
    id: 'l3',
    title: 'Attention Is All You Need (Paper Walkthrough)',
    channel: 'AI Papers Weekly',
    videoId: 'iDulhoQ2pro',
    url: 'https://youtu.be/iDulhoQ2pro',
    duration: 2210,
    addedAt: new Date('2026-08-16T18:45:00'),
    status: 'processing',
    progress: 62,
    thumbnail: 'https://img.youtube.com/vi/iDulhoQ2pro/hqdefault.jpg',
  },
  {
    id: 'l4',
    title: 'Diffusion Models from Scratch',
    channel: 'GenAI Tutorials',
    videoId: 'HoKDTa5jHvg',
    url: 'https://youtu.be/HoKDTa5jHvg',
    duration: 3120,
    addedAt: new Date('2026-08-18T07:20:00'),
    status: 'queued',
    progress: 0,
    thumbnail: 'https://img.youtube.com/vi/HoKDTa5jHvg/hqdefault.jpg',
  },
];

export const transcript: TranscriptSegment[] = [
  { start: 0, text: 'Welcome back everyone. Today we are going to break down the transformer architecture from the ground up.' },
  { start: 14, text: 'The transformer was introduced in the landmark paper Attention Is All You Need by Vaswani and colleagues in 2017.' },
  { start: 42, text: 'Before transformers, sequence models relied on recurrent neural networks which processed tokens one step at a time.' },
  { start: 78, text: 'That sequential processing made RNNs slow to train and hard to parallelize across long sequences.' },
  { start: 105, text: 'The key insight of the transformer is the self-attention mechanism which allows every token to directly attend to every other token.' },
  { start: 141, text: 'Self-attention computes three vectors per token: a query, a key, and a value.' },
  { start: 171, text: 'The query and key determine the relevance between two tokens, and the value carries the actual information.' },
  { start: 210, text: 'We take the dot product of the query with all keys, scale by the square root of the dimension, and pass it through a softmax.' },
  { start: 254, text: 'This gives us a probability distribution that weights how much each token should influence the current position.' },
  { start: 289, text: 'Multiple attention heads run this process in parallel, each focusing on a different aspect of the relationship.' },
  { start: 322, text: 'Multi-head attention is followed by a position-wise feed forward network and residual connections with layer normalization.' },
  { start: 356, text: 'Residual connections help the gradient flow during training, making very deep transformers trainable.' },
  { start: 390, text: 'Positional encodings inject information about the order of tokens since self-attention itself is permutation invariant.' },
  { start: 427, text: 'The encoder of the transformer is a stack of these identical layers, producing contextualized representations.' },
  { start: 460, text: 'The decoder attends to both the encoder outputs and the previously generated tokens to produce the output.' },
  { start: 496, text: 'A masked self-attention layer inside the decoder ensures predictions only depend on past positions.' },
  { start: 530, text: 'This masking preserves the auto-regressive property that is essential for language generation.' },
  { start: 565, text: 'Training uses masked language modeling or causal language modeling objectives over massive text corpora.' },
  { start: 600, text: 'The result is a model that can be pre-trained once and fine-tuned for translation, summarization, and question answering.' },
  { start: 643, text: 'That is the core of the transformer architecture that powers modern AI systems today.' },
];

export const chatMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    text: 'What is self-attention and why is it important?',
    timestamp: new Date('2026-08-20T10:05:00'),
  },
  {
    id: 'm2',
    role: 'ai',
    text: 'Self-attention is the core mechanism of the transformer. It lets every token in the sequence directly attend to every other token, computing relevance via queries, keys, and values. This removes the sequential bottleneck of RNNs and enables massive parallelization during training.',
    timestamp: new Date('2026-08-20T10:05:02'),
    citations: [{ time: 105 }, { time: 141 }],
  },
  {
    id: 'm3',
    role: 'user',
    text: 'How do the query, key, and value vectors work together?',
    timestamp: new Date('2026-08-20T10:06:00'),
  },
  {
    id: 'm4',
    role: 'ai',
    text: 'The query and key pair determines relevance between tokens: the dot product of a query with all keys is scaled by the square root of the dimension and passed through a softmax. That softmax distribution weights how much each token (via its value) contributes to the current position.',
    timestamp: new Date('2026-08-20T10:06:03'),
    citations: [{ time: 171 }, { time: 210 }],
  },
];

export const notes: Note[] = [
  {
    id: 'n1',
    title: 'Transformer cheat sheet',
    content:
      '- Self-attention: Q, K, V vectors per token\n- Scale dot-product by sqrt(d_model)\n- Multi-head runs in parallel\n- Residual + LayerNorm after each sublayer',
    lectureId: 'l1',
    lectureTitle: 'Transformer Architecture Explained',
    color: '#8EF0A3',
    updatedAt: new Date('2026-08-13T09:00:00'),
  },
  {
    id: 'n2',
    title: 'Backprop intuition',
    content:
      'Backpropagation is just the chain rule applied efficiently. Compute the gradient of the loss with respect to each weight by moving backward through the graph.',
    lectureId: 'l2',
    lectureTitle: 'Backpropagation & Neural Networks',
    color: '#9F8FF0',
    updatedAt: new Date('2026-08-15T14:20:00'),
  },
  {
    id: 'n3',
    title: 'Exam prep questions',
    content:
      '1. Why does softmax scaling use sqrt(d_k)?\n2. What does masking achieve in the decoder?\n3. How do residual connections help deep training?',
    color: '#FFB84D',
    updatedAt: new Date('2026-08-17T20:00:00'),
  },
];

export const bookmarks: Bookmark[] = [
  {
    id: 'b1',
    lectureId: 'l1',
    lectureTitle: 'Transformer Architecture Explained',
    quote: 'Self-attention allows every token to directly attend to every other token.',
    createdAt: new Date('2026-08-13T10:00:00'),
  },
  {
    id: 'b2',
    lectureId: 'l1',
    lectureTitle: 'Transformer Architecture Explained',
    quote: 'Residual connections help the gradient flow during training, making very deep transformers trainable.',
    createdAt: new Date('2026-08-14T11:30:00'),
  },
  {
    id: 'b3',
    lectureId: 'l2',
    lectureTitle: 'Backpropagation & Neural Networks',
    quote: 'Backpropagation is the efficient application of the chain rule to train deep networks.',
    createdAt: new Date('2026-08-16T16:45:00'),
  },
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What removes the sequential processing bottleneck of RNNs in transformers?',
    options: ['Convolutional layers', 'Self-attention', 'Long short-term memory', 'Feature pyramids'],
    correctIndex: 1,
    explanation: 'Self-attention lets every token attend to every other token in parallel, unlike the step-by-step processing of RNNs.',
    sourceTime: 105,
  },
  {
    id: 'q2',
    question: 'Which three vectors are computed per token by self-attention?',
    options: ['Input, output, hidden', 'Query, key, value', 'Red, green, blue', 'Encoder, decoder, softmax'],
    correctIndex: 1,
    explanation: 'Self-attention computes a query, a key, and a value vector for each token.',
    sourceTime: 141,
  },
  {
    id: 'q3',
    question: 'Why is the dot product scaled by the square root of the dimension?',
    options: [
      'To inflate the scores',
      'To avoid extreme softmax values for large dimensions',
      'To add noise for regularization',
      'To speed up matrix multiplication',
    ],
    correctIndex: 1,
    explanation: 'Scaling by sqrt(d_k) keeps the variance stable so softmax does not saturate for high-dimensional keys.',
    sourceTime: 210,
  },
  {
    id: 'q4',
    question: 'What does the masked self-attention inside the decoder ensure?',
    options: [
      'Predictions only depend on past positions',
      'Faster inference',
      'Higher resolution outputs',
      'Lower memory usage',
    ],
    correctIndex: 0,
    explanation: 'Masked self-attention preserves the auto-regressive property needed for language generation.',
    sourceTime: 496,
  },
  {
    id: 'q5',
    question: 'What do residual connections provide in deep transformers?',
    options: [
      'Better generalization for free',
      'Smoother gradient flow during training',
      'Lower inference cost',
      'Hardware acceleration',
    ],
    correctIndex: 1,
    explanation: 'Residual (skip) connections help gradients flow directly through the network, making deep stacks trainable.',
    sourceTime: 356,
  },
];

export const processingSteps = [
  'Fetching transcript...',
  'Cleaning transcript...',
  'Generating embeddings...',
  'Indexing chunks...',
  'Lecture ready!',
];

export const userProfile = {
  name: 'Saad Ahmed',
  email: 'saad@example.com',
  avatar: 'SA',
  joinDate: 'Jan 2026',
  videosProcessed: 12,
  questionsAsked: 347,
  streak: 14,
  minutesWatched: 1280,
};