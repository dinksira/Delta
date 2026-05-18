/** ################################ COMPONENT ############################# */
/** Mock data for the Delta Labs Q&A section. */

export interface QAAuthor {
  name: string;
  avatar?: string;
  initials: string;
}

export interface QAQuestion {
  id: string;
  title: string;
  description: string;
  tags: string[];
  isOpenEnded: boolean;
  author: QAAuthor;
  askedAt: string;
  answerCount: number;
  viewCount: number;
  status: "open" | "closed";
}

export interface QAAnswer {
  id: string;
  questionId: string;
  content: string;
  author: QAAuthor;
  answeredAt: string;
  voteCount: number;
}

export const QA_MOCK_QUESTIONS: QAQuestion[] = [
  {
    id: "q1",
    title: "Principles of Projectile Motion on an Inclined Plane",
    description: "Explain how the angle of projection, the incline angle, and the initial velocity affect the trajectory, time of flight, maximum height, and range of a projectile launched from an inclined plane. Discuss how ...",
    tags: ["Projectile Motion", "Kinematics", "Physics Theory"],
    isOpenEnded: true,
    author: {
      name: "Leul Solomon",
      initials: "LS",
    },
    askedAt: "2 days ago",
    answerCount: 1,
    viewCount: 300,
    status: "open",
  },
  {
    id: "q2",
    title: "Understanding Quantum Tunneling in Semiconductor Devices",
    description: "Provide a detailed explanation of quantum tunneling and its significance in the operation of modern semiconductor devices like Flash memory and tunnel diodes. What are the key factors that ...",
    tags: ["Quantum Physics", "Semiconductors", "Engineering"],
    isOpenEnded: true,
    author: {
      name: "Abebe Kebede",
      initials: "AK",
    },
    askedAt: "1 day ago",
    answerCount: 3,
    viewCount: 450,
    status: "open",
  },
  {
    id: "q3",
    title: "Thermodynamic Efficiency of Stirling Engines",
    description: "Analyze the theoretical maximum efficiency of a Stirling engine compared to the Carnot cycle. Discuss the practical limitations and the role of regenerators in improving overall system performance in ...",
    tags: ["Thermodynamics", "Energy Systems", "Mechanical Eng"],
    isOpenEnded: false,
    author: {
      name: "Sara Tadesse",
      initials: "ST",
    },
    askedAt: "3 hours ago",
    answerCount: 0,
    viewCount: 120,
    status: "closed",
  },
];

export const QA_MOCK_ANSWERS: QAAnswer[] = [
  {
    id: "a1",
    questionId: "q1",
    content: "You are the operator of a junction and you hear a Git branch coming. You have no idea which way it is supposed to go. You stop the train to ask the driver which direction they want. And then you set the switch appropriately to open them.",
    author: {
      name: "Leul Solomon",
      initials: "LS",
    },
    answeredAt: "4 mins ago",
    voteCount: 1,
  }
];

/** ################################ /COMPONENT ############################# */
