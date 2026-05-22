import { useRef, useState } from 'react';

export default function useAudioNotificacao() {
  const ctxRef = useRef(null);
  const [ativo, setAtivo] = useState(false);

  function ativar() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    setAtivo(true);
  }

  function tocar(beeps) {
    if (!ativo || !ctxRef.current) return;
    const ctx = ctxRef.current;
    beeps.forEach(({ freq, inicio, fim, volume = 0.25 }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime + inicio);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + fim);
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + fim);
    });
  }

  // Dois bipes agudos — novo pedido no terminal
  function beepTerminal() {
    tocar([
      { freq: 880, inicio: 0,   fim: 0.15 },
      { freq: 880, inicio: 0.2, fim: 0.35 },
    ]);
  }

  // Três bipes ascendentes — pedido pronto (garçom)
  function beepPronto() {
    tocar([
      { freq: 523, inicio: 0,    fim: 0.12 },
      { freq: 659, inicio: 0.15, fim: 0.27 },
      { freq: 784, inicio: 0.3,  fim: 0.5  },
    ]);
  }

  return { ativo, ativar, beepTerminal, beepPronto };
}
