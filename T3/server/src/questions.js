const questions = [
  { pergunta: 'Quanto é 2+2?', opcoes: ['3', '4', '5'], respostaCorreta: '4' },
  {
    pergunta: 'Capital do Brasil?',
    opcoes: ['Rio', 'Brasília', 'São Paulo'],
    respostaCorreta: 'Brasília',
  },
];

export function getRandomQuestion() {
  return questions[Math.floor(Math.random() * questions.length)];
}
