const formTargetSelect = document.querySelector('#formTarget');
const checklistTargetSelect = document.querySelector('#checklistTarget');
const verbBank = document.querySelector('#verbBank');
const zones = {
  ing: document.querySelector('#zone-ing'),
  to: document.querySelector('#zone-to'),
  both: document.querySelector('#zone-both'),
  bank: verbBank
};
const checkVerbsButton = document.querySelector('#checkVerbs');
const resetVerbsButton = document.querySelector('#resetVerbs');
const formMessage = document.querySelector('#formMessage');
const backToTopButton = document.querySelector('#backToTop');
const verbBankMore = document.querySelector('#verbBankMore');

const hypothesisPanel = document.querySelector('#hypothesisPanel');
const hypothesisScore = document.querySelector('#hypothesisScore');
const hypothesisResult = document.querySelector('#hypothesisResult');
const scoreHypothesisButton = document.querySelector('#scoreHypothesis');
const chooseHypothesisButton = document.querySelector('#chooseHypothesis');

const checklistSection = document.querySelector('#checklist');
const checklistBank = document.querySelector('#checklistBank');
const checklistZone = document.querySelector('#checklistZone');
const checklistCounter = document.querySelector('#checklistCounter');
const checklistFull = document.querySelector('#checklistFull');
const validateChecklistButton = document.querySelector('#validateChecklist');
const resetChecklistButton = document.querySelector('#resetChecklist');
const checklistResults = document.querySelector('#checklistResults');
const checklistSuggestion = document.querySelector('#checklistSuggestion');
const toContextButton = document.querySelector('#toContext');

const contextPanel = document.querySelector('#contextPanel');
const checkContextButton = document.querySelector('#checkContext');
const contextFeedback = document.querySelector('#contextFeedback');

const state = {
  verbOrder: [],
  verbZones: {},
  hypothesisId: 'A',
  userTF: {},
  bestHypothesisId: null,
  checklistBank: [],
  checklistSelection: [],
  checklistValidated: false,
  contextId: 'busy',
  contextSelections: {}
};

const distractorHints = {
  'time-rule': 'This works sometimes, but many -ing sentences are not about the past.',
  'register-rule': "Formality alone doesn’t reliably decide -ing vs to V.",
  'form-bias': "Length doesn’t equal correctness. Meaning and verb pattern matter more."
};

const shuffle = (items) => items
  .map((item) => ({ item, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ item }) => item);

const createTile = ({ id, title, subtitle, examples, onMainClick, onToggleClick }) => {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.draggable = true;
  tile.dataset.id = id;
  tile.dataset.type = 'tile';

  const header = document.createElement('div');
  header.className = 'tile-title';

  const mainButton = document.createElement('button');
  mainButton.type = 'button';
  mainButton.className = 'tile-main';
  mainButton.textContent = title;
  mainButton.addEventListener('click', (event) => {
    event.stopPropagation();
    onMainClick?.(tile);
  });

  header.appendChild(mainButton);

  if (subtitle) {
    const subtitleSpan = document.createElement('span');
    subtitleSpan.textContent = subtitle;
    subtitleSpan.className = 'tile-subtitle';
    header.appendChild(subtitleSpan);
  }

  if (examples) {
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'tile-toggle ghost';
    toggleButton.textContent = 'Examples';
    toggleButton.addEventListener('click', (event) => {
      event.stopPropagation();
      onToggleClick?.(tile);
    });
    header.appendChild(toggleButton);

    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.innerHTML = examples.map((sentence) => `<div>${sentence}</div>`).join('');
    tile.appendChild(header);
    tile.appendChild(drawer);
    return tile;
  }

  tile.appendChild(header);

  return tile;
};

const syncVerbStateFromDOM = () => {
  const order = [];
  const zonesList = ['bank', 'ing', 'to', 'both'];
  const seen = new Set();
  zonesList.forEach((zoneKey) => {
    const container = zones[zoneKey];
    container.querySelectorAll('.tile').forEach((tile) => {
      const verb = VERBS.find((item) => item.verb === tile.dataset.id);
      if (verb) {
        order.push(verb);
        seen.add(verb.verb);
        state.verbZones[verb.verb] = zoneKey;
      }
    });
  });
  VERBS.forEach((verb) => {
    if (!seen.has(verb.verb)) {
      order.push(verb);
      state.verbZones[verb.verb] = 'bank';
    }
  });
  state.verbOrder = order;
};

const renderVerbTiles = () => {
  verbBank.innerHTML = '';
  zones.ing.innerHTML = '';
  zones.to.innerHTML = '';
  zones.both.innerHTML = '';

  const bankVerbs = state.verbOrder.filter((verb) => (state.verbZones[verb.verb] || 'bank') === 'bank');
  const bankToShow = bankVerbs.slice(0, 3);
  const remainder = Math.max(bankVerbs.length - bankToShow.length, 0);

  const renderTile = (verb, zoneKey) => {
    const tile = createTile({
      id: verb.verb,
      title: verb.verb,
      examples: verb.examples,
      onMainClick: (tileElement) => {
        const zone = tileElement.parentElement?.dataset.zone;
        if (zone === 'bank') {
          moveVerbTile(verb.verb, formTargetSelect.value);
        }
        tileElement.classList.toggle('open');
      },
      onToggleClick: (tileElement) => tileElement.classList.toggle('open')
    });

    addDragHandlers(tile, 'verb');
    zones[zoneKey].appendChild(tile);
  };

  bankToShow.forEach((verb) => renderTile(verb, 'bank'));
  state.verbOrder
    .filter((verb) => (state.verbZones[verb.verb] || 'bank') !== 'bank')
    .forEach((verb) => renderTile(verb, state.verbZones[verb.verb]));

  verbBankMore.textContent = remainder > 0 ? `${remainder} more` : '';
};

const moveVerbTile = (verbId, targetZone) => {
  const tile = document.querySelector(`[data-id=\"${verbId}\"]`);
  if (tile) {
    if (tile.parentElement !== zones[targetZone]) {
      zones[targetZone].appendChild(tile);
    }
    syncVerbStateFromDOM();
    renderVerbTiles();
    return;
  }
  state.verbZones[verbId] = targetZone;
  renderVerbTiles();
};

const resetVerbSorting = () => {
  state.verbOrder = shuffle(VERBS);
  state.verbZones = {};
  formMessage.textContent = '';
  renderVerbTiles();
};

const checkVerbAnswers = () => {
  let correctCount = 0;
  state.verbOrder.forEach((verb) => {
    const zone = state.verbZones[verb.verb] || 'bank';
    const tile = document.querySelector(`[data-id="${verb.verb}"]`);
    tile?.classList.remove('correct', 'incorrect');
    if (zone === verb.category) {
      tile?.classList.add('correct');
      correctCount += 1;
    } else if (zone !== 'bank') {
      tile?.classList.add('incorrect');
    }
  });
  formMessage.textContent = `Correctly placed ${correctCount} out of ${state.verbOrder.length}.`;
};

const addDropZoneHandlers = (zoneElement, type, onDrop) => {
  zoneElement.addEventListener('dragover', (event) => {
    event.preventDefault();
    zoneElement.classList.add('over');
  });
  zoneElement.addEventListener('dragleave', () => zoneElement.classList.remove('over'));
  zoneElement.addEventListener('drop', (event) => {
    event.preventDefault();
    zoneElement.classList.remove('over');
    const id = event.dataTransfer.getData('text/plain');
    const payloadType = event.dataTransfer.getData('data-type');
    if (payloadType !== type) return;
    onDrop(id);
  });
};

const addDragHandlers = (tile, type) => {
  tile.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', tile.dataset.id);
    event.dataTransfer.setData('data-type', type);
  });

  tile.addEventListener('dragover', (event) => {
    event.preventDefault();
    const draggingId = event.dataTransfer.getData('text/plain');
    if (!draggingId || draggingId === tile.dataset.id) return;
    const dragging = document.querySelector(`[data-id="${draggingId}"]`);
    if (!dragging || dragging.parentElement !== tile.parentElement) return;
    const bounds = tile.getBoundingClientRect();
    const offset = event.clientY - bounds.top;
    if (offset < bounds.height / 2) {
      tile.parentElement.insertBefore(dragging, tile);
    } else {
      tile.parentElement.insertBefore(dragging, tile.nextSibling);
    }
  });
};

const setupVerbDnD = () => {
  addDropZoneHandlers(verbBank, 'verb', (id) => {
    moveVerbTile(id, 'bank');
    syncVerbStateFromDOM();
  });
  addDropZoneHandlers(zones.ing, 'verb', (id) => {
    moveVerbTile(id, 'ing');
    syncVerbStateFromDOM();
  });
  addDropZoneHandlers(zones.to, 'verb', (id) => {
    moveVerbTile(id, 'to');
    syncVerbStateFromDOM();
  });
  addDropZoneHandlers(zones.both, 'verb', (id) => {
    moveVerbTile(id, 'both');
    syncVerbStateFromDOM();
  });
};

const setupHypotheses = () => {
  HYPOTHESES.forEach((hypothesis) => {
    state.userTF[hypothesis.id] = Array(hypothesis.tests.length).fill(null);
  });
  renderHypothesis('A');

  document.querySelectorAll('#meaning .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      document.querySelectorAll('#meaning .tab').forEach((btn) => btn.classList.remove('active'));
      tab.classList.add('active');
      renderHypothesis(id);
    });
  });
};

const renderHypothesis = (id) => {
  state.hypothesisId = id;
  const hypothesis = HYPOTHESES.find((item) => item.id === id);
  hypothesisPanel.innerHTML = '';
  hypothesisPanel.innerHTML = `<p><strong>${hypothesis.title}</strong></p><p>${hypothesis.text}</p>`;

  hypothesis.tests.forEach((test, index) => {
    const card = document.createElement('div');
    card.className = 'test-card';
    const statement = document.createElement('p');
    statement.textContent = test.sentence;
    const buttonRow = document.createElement('div');
    buttonRow.className = 'buttons';

    ['True', 'False'].forEach((label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      const isTrue = label === 'True';
      if (state.userTF[id][index] === isTrue) {
        button.classList.add('selected');
      }
      button.addEventListener('click', () => {
        state.userTF[id][index] = isTrue;
        renderHypothesis(id);
      });
      buttonRow.appendChild(button);
    });

    card.appendChild(statement);
    card.appendChild(buttonRow);
    hypothesisPanel.appendChild(card);
  });
};

const scoreHypothesis = () => {
  const hypothesis = HYPOTHESES.find((item) => item.id === state.hypothesisId);
  const answers = state.userTF[hypothesis.id];
  if (answers.some((value) => value === null)) {
    hypothesisScore.textContent = 'Please answer all 6 tests before scoring.';
    return;
  }
  const score = answers.reduce((sum, value, index) => sum + (value === hypothesis.tests[index].expectedTF ? 1 : 0), 0);
  hypothesisScore.textContent = `You matched ${score}/6 for this hypothesis.`;
};

const chooseHypothesis = () => {
  const hypothesis = HYPOTHESES.find((item) => item.id === state.hypothesisId);
  if (hypothesis.isCorrect) {
    state.bestHypothesisId = hypothesis.id;
    hypothesisResult.textContent = 'Great choice! Hypothesis C best explains the patterns.';
    unlockChecklist();
  } else {
    hypothesisResult.textContent = 'This rule explains some cases, but fails often. Try another hypothesis.';
  }
};

const unlockChecklist = () => {
  checklistSection.classList.remove('disabled');
  checklistSection.setAttribute('aria-disabled', 'false');
};

const renderChecklistTiles = () => {
  checklistBank.innerHTML = '';
  checklistZone.innerHTML = '';

  state.checklistBank.forEach((tileItem) => {
    const tile = createChecklistTile(tileItem);
    checklistBank.appendChild(tile);
  });

  state.checklistSelection.forEach((tileItem) => {
    const tile = createChecklistTile(tileItem);
    checklistZone.appendChild(tile);
  });

  updateChecklistCounter();
};

const syncChecklistStateFromDOM = () => {
  const bankOrder = [];
  checklistBank.querySelectorAll('.tile').forEach((tile) => {
    const item = CHECKLIST_TILES.find((entry) => entry.id === tile.dataset.id);
    if (item) bankOrder.push(item);
  });
  const selectedOrder = [];
  checklistZone.querySelectorAll('.tile').forEach((tile) => {
    const item = CHECKLIST_TILES.find((entry) => entry.id === tile.dataset.id);
    if (item) selectedOrder.push(item);
  });
  state.checklistBank = bankOrder;
  state.checklistSelection = selectedOrder;
  updateChecklistCounter();
};

const createChecklistTile = (tileItem) => {
  const tile = createTile({
    id: tileItem.id,
    title: tileItem.text,
    onMainClick: () => {
      const target = checklistTargetSelect.value;
      if (target === 'checklist') {
        addToChecklist(tileItem.id);
      } else {
        removeFromChecklist(tileItem.id);
      }
    }
  });
  addDragHandlers(tile, 'checklist');
  tile.dataset.useful = tileItem.isUseful;
  tile.dataset.distractor = tileItem.distractorType || '';
  return tile;
};

const updateChecklistCounter = () => {
  checklistCounter.textContent = `${state.checklistSelection.length} / 5 selected`;
  validateChecklistButton.disabled = state.checklistSelection.length !== 5;
  toContextButton.disabled = state.checklistSelection.length !== 5 && !state.checklistValidated;
};

const addToChecklist = (id) => {
  if (state.checklistSelection.find((item) => item.id === id)) return;
  if (state.checklistSelection.length >= 5) {
    checklistFull.textContent = 'Checklist is full. Remove a tile to add another.';
    return;
  }
  checklistFull.textContent = '';
  const tile = state.checklistBank.find((item) => item.id === id);
  if (!tile) return;
  state.checklistBank = state.checklistBank.filter((item) => item.id !== id);
  state.checklistSelection.push(tile);
  renderChecklistTiles();
};

const removeFromChecklist = (id) => {
  const tile = state.checklistSelection.find((item) => item.id === id);
  if (!tile) return;
  state.checklistSelection = state.checklistSelection.filter((item) => item.id !== id);
  state.checklistBank.push(tile);
  renderChecklistTiles();
};

const setupChecklistDnD = () => {
  addDropZoneHandlers(checklistBank, 'checklist', (id) => {
    if (state.checklistSelection.find((item) => item.id === id)) {
      removeFromChecklist(id);
    } else {
      syncChecklistStateFromDOM();
    }
  });
  addDropZoneHandlers(checklistZone, 'checklist', (id) => {
    if (state.checklistSelection.find((item) => item.id === id)) {
      syncChecklistStateFromDOM();
    } else {
      addToChecklist(id);
    }
  });
};

const validateChecklist = () => {
  const tiles = checklistZone.querySelectorAll('.tile');
  let usefulCount = 0;

  tiles.forEach((tile) => {
    tile.classList.remove('useful', 'distractor');
    const hint = tile.querySelector('.tile-hint');
    if (hint) hint.remove();
    const isUseful = tile.dataset.useful === 'true';
    if (isUseful) {
      usefulCount += 1;
      tile.classList.add('useful');
    } else {
      tile.classList.add('distractor');
      const hintText = distractorHints[tile.dataset.distractor];
      if (hintText) {
        const hint = document.createElement('div');
        hint.className = 'tile-hint hint';
        hint.textContent = hintText;
        tile.appendChild(hint);
      }
    }
  });

  const distractorCount = 5 - usefulCount;
  checklistResults.innerHTML = `
    <p>Helpful questions: ${usefulCount} / 5</p>
    <p>Distractors: ${distractorCount}</p>
  `;
  checklistSuggestion.textContent = 'Swap distractors for questions about intention, verb pattern, and meaning change.';
  state.checklistValidated = true;
  toContextButton.disabled = false;
};

const resetChecklist = () => {
  state.checklistValidated = false;
  state.checklistSelection = [];
  state.checklistBank = shuffle(CHECKLIST_TILES);
  checklistResults.innerHTML = '';
  checklistSuggestion.textContent = '';
  checklistFull.textContent = '';
  renderChecklistTiles();
};

const renderContext = () => {
  const context = CONTEXT_ROTATIONS.find((item) => item.id === state.contextId);
  const saved = state.contextSelections[context.id] || {};
  contextPanel.innerHTML = `
    <p><strong>${context.title}</strong></p>
    <p>${context.context}</p>
    <p class="prompt">${context.prompt}</p>
  `;

  const radioGroup = document.createElement('div');
  radioGroup.className = 'radio-group';
  context.options.forEach((option, index) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'contextOption';
    input.value = index;
    input.checked = saved.optionIndex === index;
    input.addEventListener('change', () => {
      updateContextSelection({ optionIndex: index });
    });
    const span = document.createElement('span');
    span.textContent = option.text;
    label.appendChild(input);
    label.appendChild(span);
    radioGroup.appendChild(label);
  });
  contextPanel.appendChild(radioGroup);

  const reasonGroup = document.createElement('div');
  reasonGroup.className = 'reason-buttons';
  context.reasonButtons.forEach((reason) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = reason;
    if (saved.reason === reason) {
      button.classList.add('selected');
    }
    button.addEventListener('click', () => {
      updateContextSelection({ reason });
    });
    reasonGroup.appendChild(button);
  });
  contextPanel.appendChild(reasonGroup);
};

const updateContextSelection = (updates) => {
  const current = state.contextSelections[state.contextId] || {};
  state.contextSelections[state.contextId] = { ...current, ...updates };
  renderContext();
};

const checkContext = () => {
  const context = CONTEXT_ROTATIONS.find((item) => item.id === state.contextId);
  const saved = state.contextSelections[state.contextId] || {};
  if (saved.optionIndex === undefined) {
    contextFeedback.textContent = 'Choose a complement before checking.';
    return;
  }
  if (!saved.reason) {
    contextFeedback.textContent = 'Choose a reason tag before checking.';
    return;
  }

  const selectedOption = context.options[saved.optionIndex];
  const correctComplement = selectedOption.isCorrect;
  const correctReason = saved.reason === context.correctReason;

  if (!correctComplement) {
    contextFeedback.textContent = 'Try again: think about memory vs task.';
    return;
  }
  if (!correctReason) {
    contextFeedback.textContent = "Your form fits, but your reason tag doesn’t match the context.";
    return;
  }
  contextFeedback.textContent = 'Nice! Both the complement and reason match the context.';
};

const setupContextTabs = () => {
  document.querySelectorAll('#context .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.context;
      state.contextId = id;
      document.querySelectorAll('#context .tab').forEach((btn) => btn.classList.remove('active'));
      tab.classList.add('active');
      contextFeedback.textContent = '';
      renderContext();
    });
  });
};

const setupBackToTop = () => {
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopButton.classList.add('show');
    } else {
      backToTopButton.classList.remove('show');
    }
  });
};

checkVerbsButton.addEventListener('click', checkVerbAnswers);
resetVerbsButton.addEventListener('click', resetVerbSorting);
scoreHypothesisButton.addEventListener('click', scoreHypothesis);
chooseHypothesisButton.addEventListener('click', chooseHypothesis);
validateChecklistButton.addEventListener('click', validateChecklist);
resetChecklistButton.addEventListener('click', resetChecklist);
checkContextButton.addEventListener('click', checkContext);

toContextButton.addEventListener('click', () => {
  document.querySelector('#context').scrollIntoView({ behavior: 'smooth' });
});

resetVerbSorting();
setupVerbDnD();
setupHypotheses();
resetChecklist();
setupChecklistDnD();
renderContext();
setupContextTabs();
setupBackToTop();
