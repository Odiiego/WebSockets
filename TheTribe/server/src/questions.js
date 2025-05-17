const questions = [
  { question: 'Quanto é 2+2?', options: ['3', '4', '5'], correctAnswer: '4' },
  {
    question: 'Capital do Brasil?',
    options: ['Rio', 'Brasília', 'São Paulo'],
    correctAnswer: 'Brasília',
  },
];

export function getRandomQuestion() {
  return questions[Math.floor(Math.random() * questions.length)];
}
