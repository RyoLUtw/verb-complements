const VERBS = [
  { verb: "enjoy", category: "ing", examples: ["I enjoy reading."] },
  { verb: "avoid", category: "ing", examples: ["She avoids talking."] },
  { verb: "finish", category: "ing", examples: ["They finish eating."] },
  { verb: "keep", category: "ing", examples: ["We keep trying."] },
  { verb: "suggest", category: "ing", examples: ["He suggests waiting."] },
  { verb: "consider", category: "ing", examples: ["I consider leaving."] },
  { verb: "practice", category: "ing", examples: ["She practices writing."] },
  { verb: "miss", category: "ing", examples: ["I miss seeing you."] },
  { verb: "mind", category: "ing", examples: ["They mind sharing."] },
  { verb: "admit", category: "ing", examples: ["He admits lying."] },
  { verb: "decide", category: "to", examples: ["I decide to leave."] },
  { verb: "plan", category: "to", examples: ["She plans to study."] },
  { verb: "hope", category: "to", examples: ["They hope to win."] },
  { verb: "want", category: "to", examples: ["We want to go."] },
  { verb: "choose", category: "to", examples: ["He chooses to stay."] },
  { verb: "need", category: "to", examples: ["I need to rest."] },
  { verb: "agree", category: "to", examples: ["She agrees to help."] },
  { verb: "refuse", category: "to", examples: ["They refuse to pay."] },
  { verb: "learn", category: "to", examples: ["We learn to swim."] },
  { verb: "promise", category: "to", examples: ["He promises to call."] },
  { verb: "like", category: "both", examples: ["I like reading.", "I like to read."] },
  { verb: "love", category: "both", examples: ["She loves cooking.", "She loves to cook."] },
  { verb: "hate", category: "both", examples: ["They hate waiting.", "They hate to wait."] },
  { verb: "start", category: "both", examples: ["We start working.", "We start to work."] },
  { verb: "begin", category: "both", examples: ["He begins talking.", "He begins to talk."] },
  { verb: "prefer", category: "both", examples: ["I prefer walking.", "I prefer to walk."] },
  { verb: "continue", category: "both", examples: ["She continues writing.", "She continues to write."] },
  { verb: "try", category: "both", examples: ["She tries calling him.", "She tries to call him."] },
  { verb: "remember", category: "both", examples: ["I remember locking the door.", "I remember to lock the door."] },
  { verb: "stop", category: "both", examples: ["He stops smoking.", "He stops to smoke."] }
];

const HYPOTHESES = [
  {
    id: "A",
    title: "Hypothesis A",
    text: "“–ing = past” and “to V = future.”",
    isCorrect: false,
    tests: [
      { sentence: "I enjoy reading.", expectedTF: false },
      { sentence: "She avoids talking.", expectedTF: false },
      { sentence: "He promises to call.", expectedTF: true },
      { sentence: "I remember locking the door.", expectedTF: true },
      { sentence: "I remember to lock the door.", expectedTF: true },
      { sentence: "They hope to win.", expectedTF: true }
    ]
  },
  {
    id: "B",
    title: "Hypothesis B",
    text: "“to V is formal; –ing is casual.”",
    isCorrect: false,
    tests: [
      { sentence: "I enjoy reading.", expectedTF: false },
      { sentence: "We need to go.", expectedTF: false },
      { sentence: "She suggests waiting.", expectedTF: false },
      { sentence: "They refuse to pay.", expectedTF: false },
      { sentence: "I like reading.", expectedTF: false },
      { sentence: "I like to read.", expectedTF: false }
    ]
  },
  {
    id: "C",
    title: "Hypothesis C",
    text: "Many verbs choose complement by intention: –ing often frames an activity/experience; to V often frames a goal/plan/obligation. Some verbs are fixed by pattern; some change meaning.",
    isCorrect: true,
    tests: [
      { sentence: "I decide to leave.", expectedTF: true },
      { sentence: "She plans to study.", expectedTF: true },
      { sentence: "They enjoy reading.", expectedTF: true },
      { sentence: "He avoids talking.", expectedTF: true },
      { sentence: "I remember to lock the door.", expectedTF: true },
      { sentence: "I remember locking the door.", expectedTF: true }
    ]
  }
];

const CHECKLIST_TILES = [
  { id: "Q1", text: "Did the action already happen (in memory), or is it a task to do?", isUseful: true },
  { id: "Q2", text: "Am I talking about an experience/activity, or an intention/goal?", isUseful: true },
  { id: "Q3", text: "Is this verb pattern fixed (only -ing / only to V), or flexible (both)?", isUseful: true },
  { id: "Q4", text: "If the verb allows both, does the meaning change (like remember/stop/try)?", isUseful: true },
  { id: "Q5", text: "Is this sentence a reminder/instruction to someone?", isUseful: true },
  { id: "Q6", text: "Can I paraphrase as “It was my plan to…” or “I have a memory of…” and keep the meaning?", isUseful: true },
  { id: "Q7", text: "What is the speaker doing: describing, planning, warning, or excusing?", isUseful: true },
  { id: "Q8", text: "If I swap -ing ↔ to V, do I change what happened in the story?", isUseful: true },
  { id: "D1", text: "If it’s past, always use -ing.", isUseful: false, distractorType: "time-rule" },
  { id: "D2", text: "If it’s future, always use to V.", isUseful: false, distractorType: "time-rule" },
  { id: "D3", text: "Check the tense of the sentence; that decides -ing vs to V.", isUseful: false, distractorType: "time-rule" },
  { id: "D4", text: "Use to V when you want to sound formal.", isUseful: false, distractorType: "register-rule" },
  { id: "D5", text: "Use -ing when you want to sound casual.", isUseful: false, distractorType: "register-rule" },
  { id: "D6", text: "Choose the longer form because it is more correct.", isUseful: false, distractorType: "form-bias" }
];

const CONTEXT_ROTATIONS = [
  {
    id: "busy",
    title: "Busy morning",
    context: "I leave home. I check my keys.",
    prompt: "I remember ____ the keys.",
    options: [
      { text: "locking", isCorrect: false },
      { text: "to lock", isCorrect: true }
    ],
    reasonButtons: ["plan", "memory", "warning", "excuse"],
    correctReason: "plan"
  },
  {
    id: "apology",
    title: "Apology",
    context: "My friend is upset. I did not call.",
    prompt: "I did not remember ____ you.",
    options: [
      { text: "calling", isCorrect: false },
      { text: "to call", isCorrect: true }
    ],
    reasonButtons: ["plan", "memory", "warning", "excuse"],
    correctReason: "excuse"
  },
  {
    id: "nostalgia",
    title: "Nostalgia story",
    context: "I think about childhood.",
    prompt: "I remember ____ with my brother.",
    options: [
      { text: "playing", isCorrect: true },
      { text: "to play", isCorrect: false }
    ],
    reasonButtons: ["plan", "memory", "warning", "excuse"],
    correctReason: "memory"
  },
  {
    id: "work",
    title: "Work instruction",
    context: "My manager gives a reminder.",
    prompt: "Remember ____ the file.",
    options: [
      { text: "sending", isCorrect: false },
      { text: "to send", isCorrect: true }
    ],
    reasonButtons: ["plan", "memory", "warning", "excuse"],
    correctReason: "warning"
  }
];
