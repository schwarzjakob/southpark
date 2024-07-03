import { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const loadingMessages = [
  "Deploying parking drones",
  "Sending parking angels",
  "Untangling traffic jams",
  "Polishing parking spaces",
  "Reporting illegal parkers",
  "Rerouting traffic signs",
  "Recharging parking tickets",
  "Conducting a parking lot orchestra",
  "Charging the parking unicorns",
  "Playing hide and seek with spots",
  "Untangling the parking lot spaghetti",
  "Guiding cars to their destiny",
  "Luring out the last parking spot",
  "Negotiating with parking lot gremlins",
  "Inflating invisible parking spots",
  "Teaching cars how to parallel park",
  "Summoning parking lot wizards",
  "Exploring parking lot dimensions",
  "Unveiling secret parking spots",
  "Preparing for the grand event parking rush",
  "Aligning VIP parking spots",
  "Rolling in the deep... parking lot",
  "Hello from the other side... of the parking lot",
  "Sending your car to an easy parking heaven",
  "Parking like it's a million years ago",
  "Turning tables to find you a spot",
  "Setting fire to the rain... and to your perfect parking spot",
  "Sending SOS for parking assistance",
  "Hold on... we're finding you a spot",
  "Burnin' up... for a perfect parking spot",
  "Easy on me, finding you a parking spot",
  "Setting fire to parking struggles",
  "Hello from the perfect parking spot",
  "Finding your car a space someone like you would love",
  "Hallelujah... there's a spot for you",
  "Call me maybe... for your parking spot",
  "Unchained melody... of parking",
  "Finding your spot... because we will, we will park you",
  "Parking spots as sweet as Sweet Caroline",
  "Lean on me... your spot is almost here",
  "Guess who's back... finding your parking spot",
  "I'm beginning to feel like a parking god",
  "You only get one shot... to find a great spot",
  "We love the way you park",
  "Once upon a time... you had no parking",
  "Imagine all the parking... just for you",
  "What's going on... with finding your spot",
  "Night and day... finding your spot",
  "How many roads... to find a spot",
  "Imagine all the parking... just for you",
  "I promise... you'll park better now",
  "So you’re a parking guy... getting all the spots",
  "I'm the bad guy... finding your parking",
  "I can't sleep until I feel... your parking spot",
  "I found a spot... to park with you",
  "Good 4 u... finding your parking spot",
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

    setCurrentMessage(getRandomMessage()); // Set initial message

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
