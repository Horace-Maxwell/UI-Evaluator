import React, { useEffect, useState } from 'react';
import styled, { css, keyframes, createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.body};
    color: ${({ theme }) => theme.colors.ink};
    background: ${({ theme }) => theme.colors.foam};
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
`;

const Board = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.raised};
`;

const Row = styled.li<{ $delayed: boolean }>`
  display: grid;
  grid-template-columns: 5rem 1fr auto;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  animation: ${slideIn} ${({ theme }) => theme.motion.overlay} ${({ theme }) => theme.motion.easeOut};

  ${({ $delayed, theme }) =>
    $delayed &&
    css`
      color: ${theme.colors.warning};
      font-weight: 600;
    `}
`;

const Time = styled.time`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-variant-numeric: tabular-nums;
`;

const RefreshButton = styled.button`
  justify-self: start;
  padding: 8px 16px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.sea};
  color: ${({ theme }) => theme.colors.foam};
  transition: background-color ${({ theme }) => theme.motion.feedback} linear;

  &:hover {
    background: ${({ theme }) => theme.colors.seaDeep};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

interface Departure {
  id: string;
  time: string;
  destination: string;
  status: 'on time' | 'delayed' | 'cancelled';
}

export function DepartureBoard({ load }: { load: () => Promise<Departure[]> }) {
  const [rows, setRows] = useState<Departure[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setRows(await load());
      setError(null);
    } catch {
      setError('Departures could not be loaded. Check your connection, then choose Refresh departures.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <Board aria-labelledby="board-title">
      <h2 id="board-title">Next sailings from Oban</h2>
      {error && <p role="alert">{error}</p>}
      <ul>
        {rows.map((r) => (
          <Row key={r.id} $delayed={r.status !== 'on time'}>
            <Time dateTime={r.time}>{r.time}</Time>
            <span>{r.destination}</span>
            <span>{r.status}</span>
          </Row>
        ))}
      </ul>
      <RefreshButton type="button" onClick={refresh}>
        Refresh departures
      </RefreshButton>
    </Board>
  );
}
