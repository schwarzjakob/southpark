// src/components/Team.jsx

import React from "react";
import { Box, Typography, Grid, Link } from "@mui/material";
import tolkien from "../assets/team/tolkien.jpeg";
import eric from "../assets/team/eric.jpeg";
import tuong from "../assets/team/tuong.jpeg";
import kenny from "../assets/team/kenny.jpeg";

const teamMembers = [
  {
    name: "Jakob Schwarz",
    img: tolkien,
    linkedin: "https://www.linkedin.com/in/schwarzjakob/",
    position: "Co-Founder, Head of Technology",
  },
  {
    name: "Sven Tiefenthaler",
    img: eric,
    linkedin: "mailto:s.tiefenthaler@campus.lmu.de",
    position: "Co-Founder, Head of User Experience (UX)",
  },
  {
    name: "Nichole Chen",
    img: tuong,
    linkedin: "https://www.linkedin.com/in/pei-lin-chen-658836184/",
    position: "Co-Founder, Head of Frontend Development",
  },
  {
    name: "Timon Tirtey",
    img: kenny,
    linkedin: "https://de.linkedin.com/in/timontirtey/",
    position: "Co-Founder, Head of Product",
  },
];

const Team = () => {
  return (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h1" component="h2" gutterBottom>
        Meet the developer team
      </Typography>
      <Grid container spacing={4} justifyContent="center" sx={{ my: 4 }}>
        {teamMembers.map((member) => (
          <Grid item key={member.name} xs={12} sm={6} md={3}>
            <Link
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              underline="none"
            >
              <Box
                component="img"
                src={member.img}
                alt={member.name}
                sx={{
                  width: "300px",
                  height: "300px",
                  borderRadius: "50%",
                  border: "5px solid var(--color-primary)",
                }}
              />
              <Typography
                variant="h6"
                component="p"
                mt={2}
                color="var(--color-primary)"
              >
                {member.name}
              </Typography>
              <Typography variant="body1" component="p" mt={1}>
                {member.position}
              </Typography>
            </Link>
          </Grid>
        ))}
      </Grid>
      <Typography variant="h2" component="h2" gutterBottom>
        Project Southpark
      </Typography>
      <Typography variant="p" component="p" gutterBottom>
        Project SouthPark is a hands-on initiative that brings together Messe
        München and students from the MMT program at LMU Munich. The project's
        mission is to develop a practical MVP for optimizing parking space
        allocation during high-traffic events. This collaboration serves as a
        real-world learning opportunity for MMT students, while providing Messe
        München with innovative solutions to manage event logistics more
        effectively.
      </Typography>
    </Box>
  );
};

export default Team;
