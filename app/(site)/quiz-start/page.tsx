import { getAllChapters } from '@/lib/content';
import QuizStartClient from './QuizStartClient';

export default function QuizStartPage() {
  const chapters = getAllChapters();
  return <QuizStartClient chapters={chapters} />;
}
