import { useEffect, useRef } from 'react';
import flameGif from '../assets/flame.gif';
import badgeFuckIce from '../assets/fuck_ice_badge.png';
import badgeProImmigrants from '../assets/pro-immigrants-badge.png';
import badgeAcab from '../assets/acabbadge.png';

const OFFENDERS = [
  // add names here as they roll in
  {
    name: 'jb1361 (hcimbutidied)',
    date: 'May 2026',
    quote:
      '"its people like you who keep shubbing [politics] down my throat [...] okay you are jsut r*******"',
  },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  body { background: #000 !important; }

  .wos-root {
    background: #000;
    min-height: 100vh;
    font-family: 'Courier New', monospace;
    color: #fff;
    padding: 40px 20px 80px;
  }

  .wos-marquee {
    background: #ff0000;
    color: #ffff00;
    font-weight: bold;
    font-size: 14px;
    padding: 6px 0;
    margin-top: 16px;
    overflow: hidden;
    white-space: nowrap;
    letter-spacing: 2px;
  }

  .wos-marquee-inner {
    display: inline-block;
    animation: marquee 18s linear infinite;
  }

  @keyframes marquee {
    from { transform: translateX(100vw); }
    to   { transform: translateX(-100%); }
  }

  .wos-header {
    text-align: center;
    margin: 30px 0 10px;
  }

  .wos-title {
    font-family: 'Press Start 2P', 'Courier New', monospace;
    font-size: clamp(22px, 5vw, 48px);
    color: #ff0000;
    text-shadow:
      3px 3px 0 #660000,
      0 0 20px #ff4400,
      0 0 40px #ff2200;
    animation: flicker 2.5s infinite;
    letter-spacing: 2px;
    line-height: 1.4;
  }

  @keyframes flicker {
    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
    20%, 24%, 55% { opacity: 0.7; }
  }

  .wos-subtitle {
    color: #ff6600;
    font-size: 13px;
    margin-top: 12px;
    animation: blink 1s step-end infinite;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .wos-divider {
    border: none;
    border-top: 2px solid #ff0000;
    margin: 24px auto;
    max-width: 800px;
    box-shadow: 0 0 8px #ff0000;
  }

  .wos-statement {
    max-width: 720px;
    margin: 0 auto 32px;
    background: #0a0a0a;
    border: 2px solid #ff4400;
    border-radius: 4px;
    padding: 20px 24px;
    font-size: 13px;
    line-height: 1.8;
    color: #ccc;
    box-shadow: 0 0 12px #ff440033;
  }

  .wos-statement b {
    color: #ff6600;
  }

  .wos-counter {
    text-align: center;
    color: #ffff00;
    font-size: 13px;
    letter-spacing: 2px;
    margin-bottom: 28px;
    text-shadow: 0 0 8px #ffff00;
  }

  .wos-counter span {
    font-size: 28px;
    font-family: 'Press Start 2P', monospace;
    display: block;
    margin-top: 6px;
    color: #ff4400;
    text-shadow: 0 0 16px #ff4400;
  }

  .wos-table-wrap {
    max-width: 800px;
    margin: 0 auto;
    overflow-x: auto;
  }

  .wos-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .wos-table th {
    background: #330000;
    color: #ff4400;
    border: 1px solid #550000;
    padding: 10px 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-align: left;
  }

  .wos-table td {
    border: 1px solid #330000;
    padding: 10px 14px;
    color: #ccc;
    vertical-align: top;
  }

  .wos-table tr:nth-child(even) td {
    background: #0d0000;
  }

  .wos-table tr:hover td {
    background: #1a0000;
    color: #fff;
  }

  .wos-rank {
    color: #ff4400;
    font-weight: bold;
    text-align: center;
  }

  .wos-name {
    color: #ffcc00;
    font-weight: bold;
  }

  .wos-quote {
    color: #aaa;
    font-style: italic;
  }

  .wos-empty {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    background: #0a0a0a;
    border: 2px dashed #330000;
    border-radius: 4px;
    padding: 48px 24px;
    color: #555;
    font-size: 13px;
    line-height: 2;
  }

  .wos-footer {
    text-align: center;
    margin-top: 60px;
    color: #333;
    font-size: 11px;
    letter-spacing: 2px;
  }

  .wos-footer a {
    color: #550000;
    text-decoration: none;
  }

  .wos-footer a:hover {
    color: #ff4400;
  }

  .wos-badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin: 32px auto 0;
    max-width: 800px;
  }

  .wos-badge {
    display: inline-block;
    width: 88px;
    height: 31px;
    font-size: 7px;
    font-weight: bold;
    text-align: center;
    line-height: 1.2;
    border: 1px solid #555;
    cursor: default;
    user-select: none;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
  }

  .wos-cursor-spark {
    position: fixed;
    pointer-events: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: spark-fade 0.6s ease-out forwards;
    z-index: 99999;
  }

  @keyframes spark-fade {
    0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -150%) scale(0.2); }
  }
`;

const SPARK_COLORS = ['#ff4400', '#ff8800', '#ffcc00', '#ff0000', '#ffff00'];

export default function WallOfShame() {
  const styleRef = useRef(null);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => el.remove();
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (Math.random() > 0.4) return; // throttle
      const spark = document.createElement('div');
      spark.className = 'wos-cursor-spark';
      spark.style.left = `${e.clientX}px`;
      spark.style.top = `${e.clientY}px`;
      spark.style.background = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
      spark.style.width = `${4 + Math.random() * 6}px`;
      spark.style.height = spark.style.width;
      document.body.appendChild(spark);
      spark.addEventListener('animationend', () => spark.remove());
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="wos-root">
      <div className="wos-marquee">
        <span className="wos-marquee-inner">
          &nbsp;&nbsp;&nbsp;⚠️ WALL OF SHAME ⚠️ &nbsp;&nbsp;&nbsp; ICE SEPARATES FAMILIES
          &nbsp;&nbsp;&nbsp; ⚠️ WALL OF SHAME ⚠️ &nbsp;&nbsp;&nbsp; FUCK ICE &nbsp;&nbsp;&nbsp; ⚠️
          WALL OF SHAME ⚠️ &nbsp;&nbsp;&nbsp; ICE SEPARATES FAMILIES &nbsp;&nbsp;&nbsp;
        </span>
      </div>

      <div className="wos-header">
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
        >
          <img src={flameGif} alt="" style={{ height: '75px' }} />
          <span className="wos-title">WALL OF SHAME</span>
          <img src={flameGif} alt="" style={{ height: '75px' }} />
        </div>
        <div className="wos-subtitle">✦ Discord hall of complainers ✦</div>
      </div>

      <hr className="wos-divider" />

      <div className="wos-statement">
        <b>Statement of record:</b> this site contains the text <b>"fuck ICE"</b> because ICE (U.S.
        Immigration and Customs Enforcement) has a documented history of separating families,
        detaining children, and deporting people who have lived here for decades. That's not a
        political controversy. It's a documented human rights record.
        <br />
        <br />
        The individuals below reached out via Discord specifically to tell me this opinion is
        "unnecessary," "political," "off-putting," or some variation thereof. This page is my
        response.
        <br />
        <br />
        <b>Fuck ICE.</b>
      </div>

      <div className="wos-counter">
        TOTAL COMPLAINTS RECEIVED
        <span>{OFFENDERS.length}</span>
      </div>

      <hr className="wos-divider" />

      {OFFENDERS.length > 0 ? (
        <div className="wos-table-wrap">
          <table className="wos-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>#</th>
                <th>Discord Handle</th>
                <th>Date</th>
                <th>Their Concern</th>
              </tr>
            </thead>
            <tbody>
              {OFFENDERS.map((o, i) => (
                <tr key={i}>
                  <td className="wos-rank">{i + 1}</td>
                  <td className="wos-name">{o.name}</td>
                  <td>{o.date}</td>
                  <td className="wos-quote">{o.quote || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="wos-empty">
          🔥 No entries yet. 🔥
          <br />
          The list will grow as the brave souls arrive.
          <br />
          <br />
          <span style={{ color: '#ff4400' }}>Fuck ICE.</span>
        </div>
      )}

      <div className="wos-badges">
        <img
          src={badgeFuckIce}
          alt="Fuck ICE"
          style={{ height: '16px', imageRendering: 'pixelated' }}
        />
        <img
          src={badgeProImmigrants}
          alt="Pro Immigrants"
          style={{ height: '16px', imageRendering: 'pixelated' }}
        />
        <img src={badgeAcab} alt="ACAB" style={{ height: '16px', imageRendering: 'pixelated' }} />
      </div>

      <div className="wos-footer">
        <a href="/">← back to osrsbingohub.com</a>
        <br />
      </div>
    </div>
  );
}
