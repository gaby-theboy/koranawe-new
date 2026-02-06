import { useState, useEffect } from 'react';

export interface Question {
  explanation: string;
  id: string;
  title: string;
  choice: string[];
  choiceAnswer: number;
  questionNumbers: number;
  image?: string;
  chapterId?: string;
  _owner?: string;
  _createdDate?: string;
  _updatedDate?: string;
}

export interface QuestionSet {
  setNumber: number;
  questions: Question[];
}

export interface UserPlan {
  planId: string | null;
  planName: string;
}

export interface ApiResponse {
  success: boolean;
  sets: {
    userPlan: UserPlan;
    totalSets: number;
    sets: QuestionSet[];
  };
}

export const useQuestions = () => {
  const [questions, setQuestions] = useState<QuestionSet[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get userId from localStorage
      const userData = localStorage.getItem('user');
      let userId = '';

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          userId = parsedUser?._id || '';
          console.log('Extracted user ID:', userId);
        } catch (parseError) {
          console.error('Error parsing user data from localStorage:', parseError);
        }
      }

      console.log('Final userId being sent:', userId);

      const response = await fetch('https://dataapis.wixsite.com/kora/_functions/AllQuestionsDataInSets/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      // Store user plan information
      setUserPlan(data.sets?.userPlan || null);
      
      // Access the nested sets array
      const questionSets = data.sets?.sets || [];
      setQuestions(questionSets);
      
      console.log('User plan:', data.sets?.userPlan);
      console.log('Total sets:', data.sets?.totalSets);
      console.log('Questions sets:', questionSets);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const refetch = () => {
    fetchQuestions();
  };

  return {
    questions,
    userPlan,
    loading,
    error,
    refetch,
  };
};