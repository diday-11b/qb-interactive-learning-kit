(() => {
  'use strict';

  const synth = window.speechSynthesis;
  const available = Boolean(synth && window.SpeechSynthesisUtterance);
  const operators = { '+': 'plus', '−': 'minus', '-': 'minus', '×': 'times' };

  function speakQuestion(prompt) {
    if (!available) return;
    const equation = /^(-?\d+)\s*([+−×-])\s*(-?\d+)\s*=\s*\?$/.exec(prompt);
    const words = equation
      ? `What is ${equation[1]} ${operators[equation[2]]} ${equation[3]}?`
      : prompt;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(words);
    const voices = synth.getVoices().filter(voice => /^en(?:-|$)/i.test(voice.lang));
    const localVoices = voices.filter(voice => voice.localService);
    const voice = localVoices.find(voice => voice.default)
      || localVoices.find(voice => voice.lang === 'en-US')
      || localVoices[0]
      || voices.find(voice => voice.default)
      || voices[0];
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'en-US';
    utterance.rate = 0.87;
    synth.speak(utterance);
  }

  window.RabbitRaceVoice = { available, speakQuestion, stop: () => synth?.cancel() };
})();
