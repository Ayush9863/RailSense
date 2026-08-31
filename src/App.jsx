import { useState, useEffect, useRef, useCallback } from "react";
import {
  Cpu,
  ScanLine,
  ToggleLeft,
  WifiOff,
  Clock,
  Activity,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Circle,
  Plug,
  PlugZap
} from "lucide-react";


// =====================================================
// DESIGN TOKENS
// =====================================================

const ink = {
  bg: "#080C14",
  panel: "#0F1622",
  panelBorder: "#1C2635",
  panelBorderSoft: "#161F2C",
  text: "#DCE4EE",
  sub: "#7C8CA3",
  faint: "#4B5A70",
  amber: "#F5A524",
  amberSoft: "rgba(245,165,36,0.12)",
  green: "#33D6A0",
  greenSoft: "rgba(51,214,160,0.12)",
  red: "#F0546A",
  redSoft: "rgba(240,84,106,0.14)",
  blue: "#5B8DEF",
  blueSoft: "rgba(91,141,239,0.12)",
};


const mono = {
  fontFamily:
    "'JetBrains Mono','IBM Plex Mono',ui-monospace,monospace"
};


// =====================================================
// HELPERS
// =====================================================

function pad(n) {
  return n.toString().padStart(2, "0");
}


function fmtClock(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
    d.getSeconds()
  )}`;
}


function fmtDate(d) {
  return `${pad(d.getDate())}/${pad(
    d.getMonth() + 1
  )}/${d.getFullYear()}`;
}


// ESP32 sends weight in KG
function fmtKg(n) {
  return Number(n).toFixed(2);
}


// =====================================================
// STATUS CHIP
// =====================================================

function StatusChip({
  icon: Icon,
  label,
  sub,
  online
}) {
  const color = online
    ? ink.green
    : ink.red;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 border"
      style={{
        background: ink.panel,
        borderColor: ink.panelBorder
      }}
    >

      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
        style={{
          background: online
            ? ink.greenSoft
            : ink.redSoft,
          color
        }}
      >
        <Icon
          size={17}
          strokeWidth={2}
        />
      </div>


      <div className="min-w-0">

        <div
          className="flex items-center gap-1.5 text-[11px] tracking-wide uppercase"
          style={{ color: ink.sub }}
        >
          <Circle
            size={6}
            fill={color}
            color={color}
          />

          {label}
        </div>


        <div
          className="text-sm font-semibold truncate"
          style={{
            color: online
              ? ink.text
              : color
          }}
        >
          {online
            ? "Online"
            : "Offline"}
        </div>


        <div
          className="text-[11px] truncate"
          style={{
            color: ink.faint
          }}
        >
          {sub}
        </div>

      </div>
    </div>
  );
}


// =====================================================
// SIGNAL LAMP
// =====================================================

function SignalLamp({
  colorKey,
  active,
  pulse
}) {

  const map = {
    red: ink.red,
    amber: ink.amber,
    green: ink.green
  };

  const c = map[colorKey];

  return (
    <div
      className={
        pulse && active
          ? "animate-pulse"
          : ""
      }
      style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        background: active
          ? c
          : "#141C29",
        boxShadow: active
          ? `0 0 16px 3px ${c}88`
          : "inset 0 0 4px #00000080",
        border: `2px solid ${
          active ? c : "#242F40"
        }`,
        transition:
          "all 300ms ease"
      }}
    />
  );
}


// =====================================================
// WAGON GLYPH
// =====================================================

function WagonGlyph({
  color
}) {

  return (
    <svg
      width="34"
      height="22"
      viewBox="0 0 34 22"
      fill="none"
    >

      <rect
        x="1"
        y="2"
        width="32"
        height="14"
        rx="2"
        fill={color}
        opacity="0.9"
      />

      <rect
        x="4"
        y="5"
        width="7"
        height="6"
        rx="1"
        fill="#080C14"
        opacity="0.5"
      />

      <rect
        x="13"
        y="5"
        width="7"
        height="6"
        rx="1"
        fill="#080C14"
        opacity="0.5"
      />

      <rect
        x="22"
        y="5"
        width="7"
        height="6"
        rx="1"
        fill="#080C14"
        opacity="0.5"
      />

      <circle
        cx="8"
        cy="19"
        r="2.6"
        fill="#0B1017"
        stroke={color}
        strokeWidth="1.4"
      />

      <circle
        cx="26"
        cy="19"
        r="2.6"
        fill="#0B1017"
        stroke={color}
        strokeWidth="1.4"
      />

    </svg>
  );
}


// =====================================================
// MAIN COMPONENT
// =====================================================

export default function WagonLoadConsole() {

  const [now, setNow] =
    useState(new Date());


  // IMPORTANT:
  // Replace the IP with the IP printed by ESP32
  const [wsUrl, setWsUrl] =
    useState("ws://10.199.13.128:81");


  const [connState, setConnState] =
    useState("closed");


  const [components, setComponents] =
    useState({
      esp32: false,
      loadCell: false,
      rfid: false,
      servo: false
    });


  const [stage, setStage] =
    useState("waiting");


  const [wagon, setWagon] =
    useState(null);


  const [weight, setWeight] =
    useState(0);


  const [log, setLog] =
    useState([
      {
        id: -1,
        t: fmtClock(new Date()),
        text:
          "Console initialised — not connected to ESP32 yet.",
        tone: "sub"
      }
    ]);


  const logId =
    useRef(0);


  const wsRef =
    useRef(null);


  const stageRef =
    useRef(stage);


  const wagonRef =
    useRef(wagon);


  stageRef.current =
    stage;

  wagonRef.current =
    wagon;


  // ===================================================
  // CLOCK
  // ===================================================

  useEffect(() => {

    const t =
      setInterval(
        () =>
          setNow(
            new Date()
          ),
        1000
      );


    return () =>
      clearInterval(t);

  }, []);


  // ===================================================
  // LOG
  // ===================================================

  const pushLog =
    useCallback(
      (
        text,
        tone = "sub"
      ) => {

        setLog(
          (l) => [
            {
              id:
                logId.current++,
              t: fmtClock(
                new Date()
              ),
              text,
              tone
            },
            ...l
          ].slice(0, 40)
        );
      },
      []
    );


  // ===================================================
  // WEIGHT STATE
  // ===================================================

  useEffect(() => {

    if (
      stage !== "loading" ||
      !wagon
    ) {
      return;
    }


    if (
      weight >
      wagon.maxLoad
    ) {

      setStage(
        "overload"
      );


      pushLog(
        `Overload — ${fmtKg(
          weight
        )} kg exceeds rated ${fmtKg(
          wagon.maxLoad
        )} kg.`,
        "red"
      );

    }


    else if (
      weight >=
      wagon.maxLoad * 0.9
    ) {

      setStage(
        "ready"
      );


      pushLog(
        `${fmtKg(
          weight
        )} kg reached — ${Math.round(
          (weight /
            wagon.maxLoad) *
            100
        )}% of rated load. Ready to depart.`,
        "green"
      );
    }

  }, [
    weight,
    stage,
    wagon,
    pushLog
  ]);


  // ===================================================
  // OVERLOAD CLEAR
  // ===================================================

  useEffect(() => {

    if (
      stage === "overload" &&
      wagon &&
      weight <=
        wagon.maxLoad
    ) {

      setStage(
        weight >=
          wagon.maxLoad * 0.9
          ? "ready"
          : "loading"
      );


      pushLog(
        `Weight corrected to ${fmtKg(
          weight
        )} kg — back within safe range.`,
        "green"
      );
    }

  }, [
    weight,
    stage,
    wagon,
    pushLog
  ]);


  // ===================================================
  // HANDLE ESP32 MESSAGE
  // ===================================================

  const handleMessage =
    useCallback(
      (msg) => {

        console.log(
          "ESP32:",
          msg
        );


        switch (
          msg.type
        ) {


          // -------------------------------------------
          // STATUS
          // -------------------------------------------

          case "status":

            setComponents({
              esp32:
                !!msg.esp32,

              loadCell:
                !!msg.loadCell,

              rfid:
                !!msg.rfid,

              servo:
                !!msg.servo
            });

            break;


          // -------------------------------------------
          // IR WAGON DETECTED
          // -------------------------------------------

          case "wagon_detected":

            pushLog(
              "Wagon detected by IR sensors — waiting for RFID.",
              "amber"
            );

            break;


          // -------------------------------------------
          // RFID AUTHORIZED
          // -------------------------------------------

          case "wagon_arrived":

            setWagon({
              id:
                msg.wagonId ||
                "AUTHORIZED",
              maxLoad:
                Number(
                  msg.maxLoad
                ) || 2.0
            });


            setWeight(0);


            setStage(
              "arrived"
            );


            pushLog(
              `RFID verified — wagon ${
                msg.wagonId ||
                "AUTHORIZED"
              } at gate. Rated load ${fmtKg(
                msg.maxLoad
              )} kg.`,
              "blue"
            );

            break;


          // -------------------------------------------
          // LOADING STARTED
          // -------------------------------------------

          case "loading_started":

            setStage(
              "loading"
            );


            pushLog(
              "RFID authorized — servo gate open. Loading started.",
              "amber"
            );

            break;


          // -------------------------------------------
          // LIVE WEIGHT
          // -------------------------------------------

          case "weight":

            setWeight(
              Number(
                msg.value
              ) || 0
            );

            break;


          // -------------------------------------------
          // OVERLOAD
          // -------------------------------------------

          case "overload":

            setWeight(
              Number(
                msg.value
              ) || 0
            );


            setStage(
              "overload"
            );


            pushLog(
              `OVERLOAD — ${fmtKg(
                msg.value
              )} kg exceeds 2.00 kg.`,
              "red"
            );

            break;


          // -------------------------------------------
          // OVERLOAD CLEARED
          // -------------------------------------------

          case "overload_cleared":

            setWeight(
              Number(
                msg.value
              ) || 0
            );


            pushLog(
              `Overload cleared — ${fmtKg(
                msg.value
              )} kg.`,
              "green"
            );

            break;


          // -------------------------------------------
          // RFID REJECTED
          // -------------------------------------------

          case "rfid_rejected":

            pushLog(
              "RFID rejected — unauthorized wagon. Gate remains closed.",
              "red"
            );

            break;


          // -------------------------------------------
          // WAGON DEPARTED
          // -------------------------------------------

          case "departed":

            pushLog(
              `Wagon ${
                wagonRef.current?.id ||
                ""
              } departed. Gate closing.`.trim(),
              "sub"
            );


            setStage(
              "waiting"
            );


            setTimeout(() => {

              setWagon(
                null
              );

              setWeight(
                0
              );

            }, 400);

            break;


          // -------------------------------------------
          // UNKNOWN
          // -------------------------------------------

          default:

            console.log(
              "Unknown ESP32 message:",
              msg
            );

            break;
        }

      },
      [pushLog]
    );


  // ===================================================
  // WEBSOCKET CONNECTION
  // ===================================================

  const connect =
    useCallback(
      () => {

        if (!wsUrl) {
          return;
        }


        // Close old connection
        if (
          wsRef.current
        ) {

          try {
            wsRef.current.close();
          } catch {}
        }


        try {

          const ws =
            new WebSocket(
              wsUrl
            );


          wsRef.current =
            ws;


          setConnState(
            "connecting"
          );


          // -----------------------------------------
          // OPEN
          // -----------------------------------------

          ws.onopen =
            () => {

              setConnState(
                "open"
              );


              pushLog(
                `Connected directly to ESP32 at ${wsUrl}.`,
                "green"
              );
            };


          // -----------------------------------------
          // CLOSE
          // -----------------------------------------

          ws.onclose =
            () => {

              setConnState(
                "closed"
              );


              setComponents({
                esp32: false,
                loadCell: false,
                rfid: false,
                servo: false
              });


              pushLog(
                "ESP32 WebSocket connection closed.",
                "red"
              );
            };


          // -----------------------------------------
          // ERROR
          // -----------------------------------------

          ws.onerror =
            () => {

              pushLog(
                "WebSocket error — check ESP32 IP, Wi-Fi and port 81.",
                "red"
              );
            };


          // -----------------------------------------
          // MESSAGE
          // -----------------------------------------

          ws.onmessage =
            (evt) => {

              try {

                const msg =
                  JSON.parse(
                    evt.data
                  );


                handleMessage(
                  msg
                );

              } catch (
                error
              ) {

                console.log(
                  "Invalid WebSocket message:",
                  evt.data
                );
              }
            };

        } catch (
          error
        ) {

          setConnState(
            "closed"
          );


          pushLog(
            "Could not open WebSocket — invalid URL.",
            "red"
          );
        }

      },
      [
        wsUrl,
        handleMessage,
        pushLog
      ]
    );


  // ===================================================
  // DISCONNECT
  // ===================================================

  const disconnect =
    useCallback(
      () => {

        if (
          wsRef.current
        ) {

          wsRef.current.close();

          wsRef.current =
            null;
        }

      },
      []
    );


  // ===================================================
  // CLEANUP
  // ===================================================

  useEffect(() => {

    return () => {

      if (
        wsRef.current
      ) {

        wsRef.current.close();
      }

    };

  }, []);


  // ===================================================
  // DERIVED VALUES
  // ===================================================

  const pct =
    wagon
      ? Math.min(
          100,
          (weight /
            wagon.maxLoad) *
            100
        )
      : 0;


  const readyPct =
    90;


  const lamp =
    stage === "overload"
      ? "red"
      : stage === "ready"
      ? "green"
      : stage === "arrived" ||
        stage === "loading"
      ? "amber"
      : null;


  // ===================================================
  // STAGE META
  // ===================================================

  const stageMeta = {

    waiting: {
      title:
        "Waiting for wagon",

      desc:
        "No wagon at the weighbridge. The gate stays closed until a wagon is detected and its RFID is authorized.",

      tone:
        ink.sub
    },


    arrived: {
      title:
        "Wagon detected",

      desc:
        "Wagon detected and RFID authorized. The loading gate is opening.",

      tone:
        ink.amber
    },


    loading: {
      title:
        "Loading in progress",

      desc:
        "Weight is being read continuously from the load cell.",

      tone:
        ink.amber
    },


    ready: {
      title:
        "Ready to depart",

      desc:
        "90% of the rated load has been reached. Servo gate is closed. Move the wagon.",

      tone:
        ink.green
    },


    overload: {
      title:
        "Overload — stop loading",

      desc:
        "Maximum 2.00 kg load exceeded. The servo gate is closed.",

      tone:
        ink.red
    }

  }[stage];


  const espUp =
    components.esp32;


  // ===================================================
  // UI
  // ===================================================

  return (

    <div
      className="min-h-screen w-full"
      style={{
        background:
          ink.bg,

        color:
          ink.text,

        fontFamily:
          "'Inter',ui-sans-serif,system-ui"
      }}
    >

      <div
        className="mx-auto max-w-7xl px-5 py-6"
      >


        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="flex items-center justify-between flex-wrap gap-4 pb-6 mb-6 border-b"
          style={{
            borderColor:
              ink.panelBorderSoft
          }}
        >

          <div
            className="flex items-center gap-3"
          >

            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background:
                  ink.blueSoft
              }}
            >

              <WagonGlyph
                color={
                  ink.blue
                }
              />

            </div>


            <div>

              <div
                className="text-lg font-bold tracking-tight"
              >
                RAILSENSE
              </div>


              <div
                className="text-xs"
                style={{
                  color:
                    ink.sub
                }}
              >
                Live wagon loading console — direct ESP32 WebSocket
              </div>

            </div>

          </div>


          {/* CONNECTION */}

          <div
            className="flex items-center gap-4 flex-wrap"
          >

            <div
              className="flex items-center gap-2"
            >

              <input
                value={
                  wsUrl
                }

                onChange={
                  (e) =>
                    setWsUrl(
                      e.target.value
                    )
                }

                disabled={
                  connState !==
                  "closed"
                }

                placeholder="ws://ESP32-IP:81"

                className="text-xs rounded-lg px-3 py-1.5 outline-none disabled:opacity-50"

                style={{
                  background:
                    "#0B121D",

                  border:
                    `1px solid ${ink.panelBorderSoft}`,

                  color:
                    ink.text,

                  ...mono,

                  width: 220
                }}
              />


              {connState ===
              "open" ? (

                <button
                  onClick={
                    disconnect
                  }

                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"

                  style={{
                    background:
                      ink.redSoft,

                    color:
                      ink.red
                  }}
                >

                  <Plug
                    size={13}
                  />

                  Disconnect

                </button>

              ) : (

                <button
                  onClick={
                    connect
                  }

                  disabled={
                    connState ===
                    "connecting"
                  }

                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"

                  style={{
                    background:
                      ink.blueSoft,

                    color:
                      ink.blue
                  }}
                >

                  <PlugZap
                    size={13}
                  />

                  {connState ===
                  "connecting"
                    ? "Connecting…"
                    : "Connect"}

                </button>

              )}

            </div>


            {/* LIVE STATUS */}

            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"

              style={{
                background:
                  connState ===
                  "open"
                    ? ink.greenSoft
                    : ink.redSoft,

                color:
                  connState ===
                  "open"
                    ? ink.green
                    : ink.red
              }}
            >

              <Circle
                size={7}
                fill={
                  connState ===
                  "open"
                    ? ink.green
                    : ink.red
                }

                color={
                  connState ===
                  "open"
                    ? ink.green
                    : ink.red
                }

                className={
                  connState ===
                  "open"
                    ? "animate-pulse"
                    : ""
                }
              />

              {connState ===
              "open"
                ? "Live"
                : connState ===
                  "connecting"
                ? "Connecting"
                : "Offline"}

            </div>


            {/* CLOCK */}

            <div
              className="text-right"
            >

              <div
                className="text-lg font-bold"
                style={mono}
              >
                {fmtClock(
                  now
                )}
              </div>

              <div
                className="text-[11px]"
                style={{
                  color:
                    ink.sub
                }}
              >
                {fmtDate(
                  now
                )}
              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            OFFLINE WARNING
        ================================================= */}

        {connState !==
          "open" && (

          <div
            className="mb-6 rounded-xl px-4 py-3 flex items-center gap-3 border"

            style={{
              background:
                ink.redSoft,

              borderColor:
                "#4A2130",

              color:
                ink.red
            }}
          >

            <WifiOff
              size={18}
            />

            <div
              className="text-sm font-medium"
            >
              Not connected to the ESP32 — enter its WebSocket address above and connect.
            </div>

          </div>

        )}


        {/* =================================================
            COMPONENT STATUS
        ================================================= */}

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >

          <StatusChip
            icon={Cpu}
            label="ESP32 Node"
            sub="Sensing node"
            online={
              components.esp32
            }
          />

          <StatusChip
            icon={Scale}
            label="Load Cell"
            sub="HX711 sensor"
            online={
              components.loadCell
            }
          />

          <StatusChip
            icon={ScanLine}
            label="RFID Reader"
            sub="Gate entry scanner"
            online={
              components.rfid
            }
          />

          <StatusChip
            icon={ToggleLeft}
            label="Servo Gate"
            sub="Loading chute actuator"
            online={
              components.servo
            }
          />

        </div>


        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >


          {/* =================================================
              LEFT STATE PANEL
          ================================================= */}

          <div
            className="lg:col-span-2 rounded-2xl border p-6"

            style={{
              background:
                ink.panel,

              borderColor:
                ink.panelBorder
            }}
          >

            <div
              className="flex items-start gap-5"
            >


              {/* SIGNAL HOUSING */}

              <div
                className="flex flex-col items-center gap-2.5 rounded-xl px-3 py-4 shrink-0"

                style={{
                  background:
                    "#0B121D",

                  border:
                    `1px solid ${ink.panelBorderSoft}`
                }}
              >

                <SignalLamp
                  colorKey="red"
                  active={
                    lamp === "red"
                  }
                  pulse
                />

                <SignalLamp
                  colorKey="amber"
                  active={
                    lamp ===
                    "amber"
                  }
                  pulse={
                    stage ===
                    "loading"
                  }
                />

                <SignalLamp
                  colorKey="green"
                  active={
                    lamp ===
                    "green"
                  }
                />

              </div>


              {/* STAGE */}

              <div
                className="min-w-0 flex-1"
              >

                <div
                  className="text-2xl font-bold"
                  style={{
                    color:
                      stageMeta.tone
                  }}
                >
                  {
                    stageMeta.title
                  }
                </div>


                <div
                  className="text-sm mt-1"
                  style={{
                    color:
                      ink.sub
                  }}
                >
                  {
                    stageMeta.desc
                  }
                </div>


                {/* WAGON INFO */}

                {wagon && (

                  <div
                    className="flex items-center gap-6 mt-4 text-sm"
                  >

                    <div>

                      <div
                        className="text-[11px] uppercase tracking-wide"
                        style={{
                          color:
                            ink.faint
                        }}
                      >
                        Wagon
                      </div>

                      <div
                        className="font-bold"
                        style={mono}
                      >
                        {
                          wagon.id
                        }
                      </div>

                    </div>


                    <div>

                      <div
                        className="text-[11px] uppercase tracking-wide"
                        style={{
                          color:
                            ink.faint
                        }}
                      >
                        Rated max load
                      </div>

                      <div
                        className="font-bold"
                        style={mono}
                      >
                        {fmtKg(
                          wagon.maxLoad
                        )} kg
                      </div>

                    </div>


                    <div>

                      <div
                        className="text-[11px] uppercase tracking-wide"
                        style={{
                          color:
                            ink.faint
                        }}
                      >
                        Departure band
                      </div>

                      <div
                        className="font-bold"
                        style={mono}
                      >
                        90–100%
                      </div>

                    </div>

                  </div>

                )}

              </div>

            </div>


            {/* =================================================
                LIVE WEIGHT
            ================================================= */}

            {wagon && (

              <div
                className="mt-6 pt-6 border-t"
                style={{
                  borderColor:
                    ink.panelBorderSoft
                }}
              >

                <div
                  className="flex items-end justify-between mb-3"
                >

                  <div>

                    <div
                      className="text-[11px] uppercase tracking-wide"
                      style={{
                        color:
                          ink.faint
                      }}
                    >
                      Current weight · load cell
                    </div>


                    <div
                      className="text-4xl font-extrabold"
                      style={mono}
                    >

                      {fmtKg(
                        weight
                      )}

                      <span
                        className="text-lg font-semibold"
                        style={{
                          color:
                            ink.faint
                        }}
                      >
                        {" "}
                        kg
                      </span>

                    </div>

                  </div>


                  <div
                    className="text-sm font-semibold"
                    style={{
                      color:
                        stageMeta.tone
                    }}
                  >
                    {Math.round(
                      pct
                    )}
                    % of rated
                  </div>

                </div>


                {/* =================================================
                    PROGRESS BAR
                ================================================= */}

                <div
                  className="relative h-10 rounded-lg overflow-hidden"

                  style={{
                    background:
                      "#0B121D",

                    border:
                      `1px solid ${ink.panelBorderSoft}`
                  }}
                >

                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-500"

                    style={{
                      width:
                        `${pct}%`,

                      background:
                        stage ===
                        "overload"
                          ? ink.red
                          : pct >=
                            readyPct
                          ? ink.green
                          : ink.amber,

                      opacity:
                        0.35
                    }}
                  />


                  {/* SLEEPERS */}

                  <div
                    className="absolute inset-0 flex items-center justify-between px-1"
                  >

                    {Array.from(
                      {
                        length: 28
                      }
                    ).map(
                      (
                        _,
                        i
                      ) => (

                        <div
                          key={i}

                          style={{
                            width: 2,
                            height: 14,
                            background:
                              "#22304480"
                          }}
                        />

                      )
                    )}

                  </div>


                  {/* 90% MARKER */}

                  <div
                    className="absolute inset-y-0"

                    style={{
                      left:
                        `${readyPct}%`
                    }}
                  >

                    <div
                      style={{
                        width: 2,
                        height:
                          "100%",
                        background:
                          ink.green,
                        opacity:
                          0.7
                      }}
                    />

                  </div>


                  {/* WAGON */}

                  <div
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"

                    style={{
                      left:
                        `calc(${pct}% - 17px)`
                    }}
                  >

                    <WagonGlyph
                      color={
                        stage ===
                        "overload"
                          ? ink.red
                          : pct >=
                            readyPct
                          ? ink.green
                          : ink.amber
                      }
                    />

                  </div>

                </div>


                <div
                  className="flex justify-between text-[11px] mt-1.5"
                  style={{
                    color:
                      ink.faint
                  }}
                >

                  <span>
                    0 kg
                  </span>

                  <span
                    style={{
                      color:
                        ink.green
                    }}
                  >
                    90% · ready to depart
                  </span>

                  <span>
                    {fmtKg(
                      wagon.maxLoad
                    )} kg max
                  </span>

                </div>

              </div>

            )}

          </div>


          {/* =================================================
              RIGHT PANEL
          ================================================= */}

          <div
            className="flex flex-col gap-6"
          >


            {/* =================================================
                DECISION SUMMARY
            ================================================= */}

            <div
              className="rounded-2xl border p-5"

              style={{
                background:
                  ink.panel,

                borderColor:
                  ink.panelBorder
              }}
            >

              <div
                className="flex items-center gap-2 mb-4"
              >

                {stage ===
                "overload" ? (

                  <ShieldAlert
                    size={18}
                    color={
                      ink.red
                    }
                  />

                ) : (

                  <ShieldCheck
                    size={18}
                    color={
                      ink.green
                    }
                  />

                )}

                <div
                  className="font-bold text-sm"
                >
                  Decision summary
                </div>

              </div>


              <SummaryRow
                label="Stage"
                value={
                  stageMeta.title
                }
                valueColor={
                  stageMeta.tone
                }
              />


              <SummaryRow
                label="Load state"
                value={
                  stage ===
                  "overload"
                    ? "Overload"
                    : "Normal"
                }
                valueColor={
                  stage ===
                  "overload"
                    ? ink.red
                    : ink.green
                }
              />


              <SummaryRow
                label="% of rated load"
                value={
                  wagon
                    ? `${Math.round(
                        pct
                      )}%`
                    : "—"
                }
              />


              <SummaryRow
                label="RFID"
                value={
                  components.rfid
                    ? "Active"
                    : "Inactive"
                }
                valueColor={
                  components.rfid
                    ? ink.green
                    : ink.red
                }
                last
              />

            </div>


            {/* =================================================
                EVENT LOG
            ================================================= */}

            <div
              className="rounded-2xl border p-5 flex-1 min-h-[220px] flex flex-col"

              style={{
                background:
                  ink.panel,

                borderColor:
                  ink.panelBorder
              }}
            >

              <div
                className="flex items-center gap-2 mb-3"
              >

                <Activity
                  size={16}
                  color={
                    ink.blue
                  }
                />

                <div
                  className="font-bold text-sm"
                >
                  Event log
                </div>

              </div>


              <div
                className="space-y-2.5 overflow-y-auto pr-1"
                style={{
                  maxHeight: 320
                }}
              >

                {log.map(
                  (
                    entry
                  ) => (

                    <div
                      key={
                        entry.id
                      }
                      className="text-xs leading-relaxed"
                    >

                      <span
                        style={{
                          ...mono,
                          color:
                            ink.faint
                        }}
                      >
                        {
                          entry.t
                        }
                      </span>

                      {" "}

                      <span
                        style={{
                          color:
                            entry.tone ===
                            "sub"
                              ? ink.sub
                              : ink.text
                        }}
                      >
                        {
                          entry.text
                        }
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// SUMMARY ROW
// =====================================================

function SummaryRow({
  label,
  value,
  valueColor,
  last
}) {

  return (

    <div
      className="flex items-center justify-between py-2"

      style={{
        borderBottom:
          last
            ? "none"
            : `1px solid ${ink.panelBorderSoft}`
      }}
    >

      <div
        className="text-xs"
        style={{
          color:
            ink.sub
        }}
      >
        {label}
      </div>


      <div
        className="text-sm font-semibold"
        style={{
          color:
            valueColor ||
            ink.text
        }}
      >
        {value}
      </div>

    </div>
  );
}