export const QUIZ_SET_TEST_DATA = [
  {
    title: '재미있는 상식 퀴즈',
    category: 'GENERAL',
    quizList: [
      {
        quiz: '다음 중 대한민국의 수도는?',
        limitTime: 30,
        choiceList: [
          {
            content: '서울',
            order: 1,
            isAnswer: true
          },
          {
            content: '부산',
            order: 2,
            isAnswer: false
          },
          {
            content: '인천',
            order: 3,
            isAnswer: false
          },
          {
            content: '대구',
            order: 4,
            isAnswer: false
          }
        ]
      },
      {
        quiz: '1년은 몇 개월인가요?',
        limitTime: 20,
        choiceList: [
          {
            content: '10개월',
            order: 1,
            isAnswer: false
          },
          {
            content: '11개월',
            order: 2,
            isAnswer: false
          },
          {
            content: '12개월',
            order: 3,
            isAnswer: true
          },
          {
            content: '13개월',
            order: 4,
            isAnswer: false
          }
        ]
      }
    ]
  },
  {
    title: 'IT 기초 지식 테스트',
    category: 'IT',
    quizList: [
      {
        quiz: 'HTML은 무엇의 약자인가요?',
        limitTime: 45,
        choiceList: [
          {
            content: 'Hyper Text Markup Language',
            order: 1,
            isAnswer: true
          },
          {
            content: 'High Tech Modern Language',
            order: 2,
            isAnswer: false
          },
          {
            content: 'Hyper Transfer Markup Language',
            order: 3,
            isAnswer: false
          },
          {
            content: 'High Text Modern Language',
            order: 4,
            isAnswer: false
          }
        ]
      },
      {
        quiz: '다음 중 프론트엔드 프레임워크가 아닌 것은?',
        limitTime: 40,
        choiceList: [
          {
            content: 'React',
            order: 1,
            isAnswer: false
          },
          {
            content: 'Django',
            order: 2,
            isAnswer: true
          },
          {
            content: 'Vue',
            order: 3,
            isAnswer: false
          },
          {
            content: 'Angular',
            order: 4,
            isAnswer: false
          }
        ]
      }
    ]
  },
  {
    title: '역사 퀴즈',
    category: 'HISTORY',
    quizList: [
      {
        quiz: '세종대왕이 훈민정음을 반포한 연도는?',
        limitTime: 30,
        choiceList: [
          {
            content: '1443년',
            order: 1,
            isAnswer: false
          },
          {
            content: '1444년',
            order: 2,
            isAnswer: false
          },
          {
            content: '1445년',
            order: 3,
            isAnswer: false
          },
          {
            content: '1446년',
            order: 4,
            isAnswer: true
          }
        ]
      },
      {
        quiz: '임진왜란이 일어난 연도는?',
        limitTime: 30,
        choiceList: [
          {
            content: '1592년',
            order: 1,
            isAnswer: true
          },
          {
            content: '1596년',
            order: 2,
            isAnswer: false
          },
          {
            content: '1598년',
            order: 3,
            isAnswer: false
          },
          {
            content: '1600년',
            order: 4,
            isAnswer: false
          }
        ]
      }
    ]
  },
  {
    title: '영어 문법 테스트',
    category: 'LANGUAGE',
    quizList: [
      {
        quiz: '다음 중 현재완료 시제는?',
        limitTime: 40,
        choiceList: [
          {
            content: 'I am going',
            order: 1,
            isAnswer: false
          },
          {
            content: 'I have gone',
            order: 2,
            isAnswer: true
          },
          {
            content: 'I will go',
            order: 3,
            isAnswer: false
          },
          {
            content: 'I went',
            order: 4,
            isAnswer: false
          }
        ]
      },
      {
        quiz: '다음 중 관계대명사가 아닌 것은?',
        limitTime: 35,
        choiceList: [
          {
            content: 'which',
            order: 1,
            isAnswer: false
          },
          {
            content: 'when',
            order: 2,
            isAnswer: false
          },
          {
            content: 'how',
            order: 3,
            isAnswer: true
          },
          {
            content: 'that',
            order: 4,
            isAnswer: false
          }
        ]
      }
    ]
  },
  {
    title: '과학 상식',
    category: 'SCIENCE',
    quizList: [
      {
        quiz: '물의 화학식은?',
        limitTime: 25,
        choiceList: [
          {
            content: 'H2O',
            order: 1,
            isAnswer: true
          },
          {
            content: 'CO2',
            order: 2,
            isAnswer: false
          },
          {
            content: 'O2',
            order: 3,
            isAnswer: false
          },
          {
            content: 'H2O2',
            order: 4,
            isAnswer: false
          }
        ]
      },
      {
        quiz: '태양계에서 가장 큰 행성은?',
        limitTime: 30,
        choiceList: [
          {
            content: '화성',
            order: 1,
            isAnswer: false
          },
          {
            content: '목성',
            order: 2,
            isAnswer: true
          },
          {
            content: '토성',
            order: 3,
            isAnswer: false
          },
          {
            content: '천왕성',
            order: 4,
            isAnswer: false
          }
        ]
      }
    ]
  }
];
