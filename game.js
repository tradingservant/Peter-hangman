(function () {
  "use strict";

  var WORDS = ["kill", "knock", "down"];
  var MAX_WRONG = 6;
  var KEY_ROWS = ["abcdefg", "hijklmn", "opqrstu", "vwxyz"];

  var secret = "";
  var previousWord = "";
  var guessed = Object.create(null);
  var guessOrder = [];
  var wrong = 0;
  var phase = "playing";
  var lastGuess = "";

  var stageEl = document.getElementById("stage");
  var wordEl = document.getElementById("word");
  var messageEl = document.getElementById("message");
  var guessedEl = document.getElementById("guessed");
  var wrongEl = document.getElementById("wrong-count");
  var keyboardEl = document.getElementById("keyboard");
  var nextBtn = document.getElementById("next-round");
  var parts = Array.prototype.slice.call(document.querySelectorAll("[data-part]"));
  var keys = Object.create(null);

  function pickWord(previous) {
    var pool = [];
    for (var i = 0; i < WORDS.length; i += 1) {
      if (WORDS[i] !== previous) pool.push(WORDS[i]);
    }
    var choices = pool.length ? pool : WORDS.slice();
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function wordIsRevealed() {
    for (var i = 0; i < secret.length; i += 1) {
      if (!guessed[secret.charAt(i)]) return false;
    }
    return true;
  }

  function startRound() {
    secret = pickWord(previousWord);
    previousWord = secret;
    guessed = Object.create(null);
    guessOrder = [];
    wrong = 0;
    phase = "playing";
    lastGuess = "";
    render();
  }

  function guess(letter) {
    letter = String(letter || "").toLowerCase();
    if (!/^[a-z]$/.test(letter)) return;
    if (phase !== "playing") return;
    if (guessed[letter]) return;

    guessed[letter] = true;
    guessOrder.push(letter);
    lastGuess = letter;
    if (secret.indexOf(letter) === -1) wrong += 1;

    if (wordIsRevealed()) phase = "won";
    else if (wrong >= MAX_WRONG) phase = "lost";

    render();
  }

  function messageText() {
    if (phase === "won") return "You got it. The word is " + secret.toUpperCase() + ".";
    if (phase === "lost") return "Out of guesses. The word was " + secret.toUpperCase() + ".";
    if (!lastGuess) return secret.length + " letters. Guess a letter.";
    var shown = lastGuess.toUpperCase();
    if (secret.indexOf(lastGuess) !== -1) return shown + " is in the word.";
    return shown + " is not in the word.";
  }

  function renderWord() {
    var spoken = [];
    wordEl.textContent = "";
    for (var i = 0; i < secret.length; i += 1) {
      var ch = secret.charAt(i);
      var tile = document.createElement("span");
      tile.className = "tile";
      if (guessed[ch] || phase === "lost") {
        tile.textContent = ch.toUpperCase();
        if (phase === "lost" && !guessed[ch]) tile.classList.add("missed");
        spoken.push(ch.toUpperCase());
      } else {
        tile.classList.add("blank");
        spoken.push("blank");
      }
      wordEl.appendChild(tile);
    }
    wordEl.setAttribute("aria-label", "Word: " + spoken.join(", "));
  }

  function renderGuessed() {
    guessedEl.textContent = "";
    if (!guessOrder.length) {
      guessedEl.textContent = "Guessed: none yet";
      return;
    }
    guessedEl.appendChild(document.createTextNode("Guessed: "));
    for (var i = 0; i < guessOrder.length; i += 1) {
      var letter = guessOrder[i];
      var chip = document.createElement("span");
      chip.className = "chip " + (secret.indexOf(letter) === -1 ? "bad" : "good");
      chip.textContent = letter.toUpperCase();
      guessedEl.appendChild(chip);
    }
  }

  function renderKeyboard() {
    var letters = Object.keys(keys);
    for (var i = 0; i < letters.length; i += 1) {
      var letter = letters[i];
      var button = keys[letter];
      var used = !!guessed[letter];
      button.disabled = used || phase !== "playing";
      button.classList.toggle("correct", used && secret.indexOf(letter) !== -1);
      button.classList.toggle("wrong", used && secret.indexOf(letter) === -1);
    }
  }

  function render() {
    renderWord();
    renderGuessed();
    renderKeyboard();
    wrongEl.textContent = "Wrong guesses: " + wrong + " / " + MAX_WRONG;
    messageEl.textContent = messageText();
    messageEl.classList.toggle("win", phase === "won");
    messageEl.classList.toggle("lose", phase === "lost");
    messageEl.classList.toggle("play", phase === "playing");
    stageEl.classList.toggle("is-won", phase === "won");
    stageEl.classList.toggle("is-lost", phase === "lost");
    nextBtn.textContent = phase === "playing" ? "New round" : "Play again";
    for (var i = 0; i < parts.length; i += 1) {
      parts[i].classList.toggle("on", wrong >= Number(parts[i].getAttribute("data-part")));
    }
  }

  function buildKeyboard() {
    for (var r = 0; r < KEY_ROWS.length; r += 1) {
      var row = document.createElement("div");
      row.className = "keyboard-row";
      var letters = KEY_ROWS[r];
      for (var i = 0; i < letters.length; i += 1) {
        var letter = letters.charAt(i);
        var button = document.createElement("button");
        button.type = "button";
        button.className = "key";
        button.dataset.letter = letter;
        button.textContent = letter.toUpperCase();
        button.setAttribute("aria-label", letter.toUpperCase());
        button.addEventListener("click", function (event) {
          guess(event.currentTarget.dataset.letter);
        });
        keys[letter] = button;
        row.appendChild(button);
      }
      keyboardEl.appendChild(row);
    }
  }

  function onKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Enter" && phase !== "playing") {
      event.preventDefault();
      startRound();
      return;
    }
    if (/^[a-zA-Z]$/.test(event.key)) guess(event.key);
  }

  buildKeyboard();
  nextBtn.addEventListener("click", startRound);
  document.addEventListener("keydown", onKeyDown);
  startRound();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    });
  }
})();
