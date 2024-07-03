import { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const loadingMessages = [
  "🚁 Deploying parking drones",
  "👼 Sending parking angels",
  "🚦 Untangling traffic jams",
  "✨ Polishing parking spaces",
  "🚓 Reporting illegal parkers",
  "🔄 Rerouting traffic signs",
  "🔋 Recharging parking tickets",
  "🎼 Conducting a parking lot orchestra",
  "🦄 Charging the parking unicorns",
  "🔍 Playing hide and seek with spots",
  "🍝 Untangling the parking lot spaghetti",
  "🚗 Guiding cars to their destiny",
  "🕵️‍♂️ Luring out the last parking spot",
  "🤝 Negotiating with parking lot gremlins",
  "🎈 Inflating invisible parking spots",
  "🅿️ Teaching cars how to parallel park",
  "🧙‍♂️ Summoning parking lot wizards",
  "🌌 Exploring parking lot dimensions",
  "🔍 Unveiling secret parking spots",
  "🎬 Preparing the parking show",
  "🌌 Aligning the stars for your spot",
  "🦸‍♂️ Supercharging your parking experience",
  "🦖 Clearing dinosaurs from parking spots",
  "👽 Scanning for alien parking",
  "🚀 Launching parking satellites",
  "🏰 Building your parking castle",
  "🔮 Gazing into the parking crystal ball",
  "🐉 Training your parking dragon",
  "🌈 Finding your parking at the end of the rainbow",
  "🧹 Sweeping for the cleanest spot",
  "🕹️ Playing Tetris with cars",
  "🧩 Solving the parking puzzle",
  "📡 Tuning into parking frequencies",
  "🖼️ Framing your parking experience",
  "📦 Unpacking new parking spots",
  "🔓 Unlocking premium parking",
  "🧬 Sequencing parking genes",
  "🗝️ Keying in the best spots",
  "🎨 Painting the parking masterpiece",
  "🔍 Magnifying the perfect spot",
  "🌲 Planting new parking spaces",
  "🎠 Spinning the parking carousel",
  "🎈 Inflating parking opportunities",
  "🍭 Sweetening your parking deal",
  "🎭 Directing parking traffic",
  "🎹 Composing the parking symphony",
  "🎨 Drawing your parking map",
  "📸 Capturing parking moments",
  "🎡 Rotating the parking wheel",
  "🏅 Awarding gold medal spots",
  "🚀 Blasting off to parking zones",
  "💫 Starring in parking adventures",
  "🎲 Rolling the parking dice",
  "🎬 Producing parking scenes",
  "🎧 Tuning into parking jams",
  "🎷 Jazzing up your parking",
  "🎻 Bowing to the best spots",
  "🎹 Hitting the parking keys",
  "🥁 Drumming up parking spots",
  "🎻 Playing the parking violin",
  "🎙️ Broadcasting parking news",
  "📼 Rewinding parking tapes",
  "🎥 Filming parking stories",
  "📡 Broadcasting parking waves",
  "🎇 Sparkling parking spots",
  "🎆 Fireworking parking magic",
  "🌌 Exploring parking galaxies",
  "🌙 Moonlighting as parking guides",
  "🌤️ Clearing the parking forecast",
  "🔥 Heating up parking",
  "🌪️ Spinning up parking spots",
  "🌊 Surfing for parking waves",
  "🗻 Climbing parking peaks",
  "🏢 Skyscraping parking views",
  "🏗️ Constructing new spots",
  "🏚️ Renovating parking spaces",
  "🏘️ Neighboring parking spots",
  "🏖️ Beaching for parking",
  "🏞️ Nature finding your spot",
  "🔄 Adjusting your vehicle's destiny",
  "📡 Connecting to space for the perfect spot",
  "🌌 Navigating the parking cosmos",
  "🔍 Discovering hidden parking opportunities",
  "📜 Unrolling the parking treasure map",
  "🔓 Unlocking secret parking spaces",
  "🧭 Setting your compass to 'parking'",
  "🧬 Decoding the perfect fit",
  "🎯 Hitting the bullseye for spaces",
  "🎞️ Rewinding for the last spot",
  "🧵 Weaving through available areas",
  "🔋 Charging up prime locations",
  "🎶 Conducting the symphony of spots",
  "📡 Scanning the horizons",
  "📦 Unpacking new possibilities",
  "🧱 Building a network of spaces",
  "📊 Charting the best areas",
  "🔎 Magnifying ideal locations",
  "🚦 Coordinating smooth entries",
  "🛤️ Tracking the best routes",
  "🔋 Recharging available spots",
  "🎟️ Issuing VIP passes",
  "📅 Scheduling optimal times",
  "🔦 Highlighting opportunities",
  "📜 Unfolding the map",
  "🌌 Exploring the layout",
  "🔧 Adjusting settings",
  "🔒 Securing spots",
  "📏 Measuring distances",
  "🔋 Powering up options",
  "🔭 Surveying the landscape",
  "📡 Tracking signals",
  "🛠️ Refining selections",
  "🔍 Revealing hidden areas",
  "📈 Plotting your course",
  "🔓 Unlocking the best spots",
  "📸 Capturing the perfect fit",
  "🎨 Designing your route",
  "🎬 Producing the best scenes",
  "🔮 Foreseeing availability",
  "🔍 Detecting optimal areas",
  "📜 Revealing the master plan",
  "🎶 Harmonizing locations",
  "🔍 Discovering the details",
  "🔧 Perfecting the solution",
  "🎉 Preparing for the grand event parking rush",
  "⭐ Aligning VIP parking spots",
  "🌊 Rolling in the deep... parking lot",
  "📞 Hello from the other side... of the parking lot",
  "🌤️ Sending your car to an easy parking heaven",
  "🦕 Parking like it's a million years ago",
  "🔄 Turning tables to find you a spot",
  "☔️ Setting fire to the rain... and to your perfect parking spot",
  "📡 Sending SOS for parking assistance",
  "⏳ Hold on... we're finding you a spot",
  "🧘 Easy on me, finding you a parking spot",
  "🔥 Setting fire to parking struggles",
  "👋 Hello from the perfect parking spot",
  "💖 Finding your car a space someone like you would love",
  "🎶 Hallelujah... there's a spot for you",
  "📞 Call me maybe... for your parking spot",
  "⛓️‍💥 Unchained melody... of parking",
  "🎵 Finding your spot... because we will, we will park you",
  "🎤 Parking spots as sweet as Sweet Caroline",
  "👐 Lean on me... your spot is almost here",
  "🕵️‍♀️ Guess who's back... finding your parking spot",
  "🚀 I'm beginning to feel like a parking god",
  "🎯 You only get one shot... to find a great spot",
  "❤️ We love the way you park",
  "📖 Once upon a time... you had no parking",
  "🌈 Imagine all the parking... just for you",
  "❓ What's going on... with finding your spot",
  "🌙 Night and day... finding your spot",
  "🌍 How many roads... to find a spot",
  "🤝 I promise... you'll park better now",
  "❤️‍🔥 So you’re a parking guy... getting all the spots",
  "👿 I'm the bad guy... finding your parking",
  "😴 I can't sleep until I feel... your parking spot",
  "🤝 I found a spot... to park with you",
  "👍 Good 4 u... finding your parking spot",
  "🪐 May the parking be with you",
  "🦸‍♂️ Assembling the Avengers for your parking spot",
  "🌍 There's no place like your parking spot",
  "💔 Frankly, my dear, I don't give a parking ticket",
  "🎩 Here's looking at you, parking kid",
  "🌟 May the force park with you",
  "🕶️ I'll be parked",
  "👽 E.T. found your parking spot",
  "🕸️ Your friendly neighborhood parking spot",
  "🍫 Life is like a box of parking spots",
  "🐴 You've got a friend in parking",
  "📜 I'm gonna make you a parking offer you can't refuse",
  "🧟 They're coming to park",
  "👨‍🚀 Houston, we have a parking spot",
  "💍 My precious... parking spot",
  "💡 Park hard or go home",
  "🐧 Just keep parking",
  "🕰️ I'll be back... to park",
  "⚡ You're a parking wizard, Harry",
  "🍿 I'll have what she's parking",
  "🎩 Keep your friends close, but your parking closer",
  "🚣 I'm the king of the parking lot!",
  "🕴️ I feel the need... the need to park",
  "🌌 In space, no one can hear you park",
  "🪤 It's a parking trap",
  "🍕 Hasta la vista, parking",
  "🏴‍☠️ This is the day you will always remember as the day you parked",
  "🌪️ There's no place like a parking spot",
  "🐯 Remember who you parked with",
  "🏎️ Great Scott! You've found a parking spot",
  "🎵 We don't talk about parking",
  "🦖 Hold onto your parking spots",
  "🌄 Go ahead, make my parking day",
  "🎥 May the parking be ever in your favor",
  "🔍 Elementary, my dear parking",
  "🎞️ You either park a hero or see yourself become a villain",
  "🦁 Long live the parking",
  "🎹 All work and no parking makes Jack a dull boy",
  "🧞‍♂️ You've never had a parking spot like this",
  "🧙‍♂️ You shall not park",
  "🕶️ I see dead parking spots",
  "👨‍🚀 This is ground control to parking spot",
  "🦈 We're gonna need a bigger parking lot",
  "🍎 Here's Johnny... parking",
  "🎩 I see your parking spot is as big as mine",
  "🧛‍♂️ I'm Batman... and I parked",
  "🐢 It's not a parking, it's a spot",
  "🕷️ With great parking comes great responsibility",
  "🍻 I'll park what she's parking",
  "🐅 It's a jungle out there... for parking",
  "🌋 Go ahead, make my parking day",
  "👑 May the odds be ever in your favor... for parking",
  "🎭 A parking spot to remember",
  "🎙️ I'm gonna make you a parking spot you can't refuse",
  "🧊 Keep your friends close, but your parking spots closer",
  "🦩 Nobody puts parking in a corner",
  "🗻 This is the beginning of a beautiful parking spot",
  "🦷 Say hello to my little parking spot",
  "🏺 I am parking",
  "🛎️ Inconceivable parking!",
  "🗽 I'll have what she's parking",
  "🌇 I'm having an old friend for parking",
  "🧳 They call me Mister Parking!",
  "🧦 It’s a wonderful parking spot",
  "🏴‍☠️ Aye captain, we're taking over the parking lot",
  "🐡 Finding parking",
];

const LoadingSpinnerWithMessages = () => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [dots, setDots] = useState("");

  useEffect(() => {
    const getRandomMessage = () =>
      loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

    const messageIntervalId = setInterval(() => {
      setCurrentMessage(getRandomMessage());
    }, 10000);

    setCurrentMessage(getRandomMessage());

    return () => clearInterval(messageIntervalId);
  }, []);

  useEffect(() => {
    const dotsIntervalId = setInterval(() => {
      setDots((prevDots) => {
        if (prevDots.length >= 3) {
          return "";
        }
        return prevDots + ".";
      });
    }, 300);

    return () => clearInterval(dotsIntervalId);
  }, []);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <CircularProgress />
      <Typography
        variant="h6"
        sx={{
          marginTop: 2,
          marginBottom: 2,
          animation: "fadein 1s",
        }}
      >
        {currentMessage}
        {dots}
      </Typography>
      <style>
        {`
          @keyframes fadein {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default LoadingSpinnerWithMessages;
