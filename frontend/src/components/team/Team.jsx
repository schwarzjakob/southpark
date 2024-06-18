// src/components/Team.jsx
import {
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Link,
} from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import "./styles/TeamComponent.css";
import tolkien from "../../assets/team/tolkien.jpeg";
import eric from "../../assets/team/eric.jpeg";
import tuong from "../../assets/team/tuong.jpeg";
import kenny from "../../assets/team/kenny.jpeg";

const CONTENT = [
  {
    headline: "Meet our team",
    description:
      "Project SouthPark is a hands-on initiative that brings together Messe München and students from the MMT program at LMU Munich. The project's mission is to develop a practical MVP for optimizing parking space allocation during high-traffic events. This collaboration serves as a real-world learning opportunity for MMT students, while providing Messe München with innovative solutions to manage event logistics more effectively.",
  },
];

const TEAM_MEMBERS = [
  {
    name: "Nichole Chen",
    img: tuong,
    position: "",
    linkedIn: "https://www.linkedin.com/in/pei-lin-chen-658836184/",
    email: "mailto:pei.chen@campus.lmu.de",
  },
  {
    name: "Jakob Schwarz",
    img: tolkien,
    position: "",
    linkedIn: "https://www.linkedin.com/in/schwarzjakob/",
    email: "mailto:jakob.schwarz@campus.lmu.de",
  },
  {
    name: "Sven Tiefenthaler",
    img: eric,
    position: "",
    linkedIn: "https://www.linkedin.com/in/sven-tiefenthaler-a7617221b/",
    email: "mailto:s.tiefenthaler@campus.lmu.de",
  },
  {
    name: "Timon Tirtey",
    img: kenny,
    position: "",
    linkedIn: "https://www.linkedin.com/in/timontirtey/",
    email: "mailto:t.tirtey@campus.lmu.de",
  },
];

const renderTeam = () => {
  return (
    <Container className="outer-container">
      <Grid container className="inner-container">
        <Grid item xs={12} md={4} className="headings-container">
          <Typography variant="h2" className="heading-text">
            {CONTENT[0].headline}
          </Typography>

          <Typography variant="body1" className="sub-heading-text">
            {CONTENT[0].description}
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          md={8}
          container
          spacing={2}
          className="team-members-container"
        >
          {TEAM_MEMBERS.map((member, index) => (
            <Grid item xs={12} sm={6} key={index} className="card-container">
              <Card className="card">
                <CardMedia
                  className="card-img"
                  component="img"
                  alt={member.name}
                  height="250"
                  image={member.img}
                />
                <CardContent className="content">
                  <Typography variant="h6" className="name center">
                    {member.name}
                  </Typography>
                  <div className="center">
                    <IconButton
                      component={Link}
                      href={member.linkedIn}
                      target="_blank"
                      rel="noopener"
                      className="icon-button"
                    >
                      <LinkedInIcon />
                    </IconButton>
                    <IconButton
                      component={Link}
                      href={member.email}
                      className="icon-button"
                    >
                      <EmailIcon />
                    </IconButton>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Container>
  );
};

function TeamComponent() {
  return renderTeam();
}

export default TeamComponent;
