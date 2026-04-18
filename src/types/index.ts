export interface LessonContent {
    id: string;
    type: 'video' | 'document' | 'quiz' | 'interactive';
    title: string;
    url?: string;
    description?: string;
}

export interface Lesson {
    _id: string;
    courseId: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    contents: LessonContent[];
    isPublished: boolean;
    viewCount: number;
}

export interface QuizQuestion {
    id: string;
    type: string;
    question: string;
    options: Array<{ id: string; text: string; isCorrect: boolean }>; // Changed to required isCorrect for feedback logic
    points: number;
    explanation?: string;
}

export interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    timeLimit?: number;
    totalPoints: number;
}
