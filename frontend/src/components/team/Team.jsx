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

const iframeContainerStyle = {
  position: "relative",
  paddingBottom: "56.25%",
  height: 0,
  overflow: "hidden",
  maxWidth: "100%",
  background: "#000",
};

const iframeStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  border: 0,
};

const CONTENT = {
  headline: "Meet the Team Behind Project SouthPark",
  description:
    "Welcome to the SouthPark team page! We are thrilled to introduce you to the dynamic and innovative minds driving the most groundbreaking project in event logistics optimization at Messe München. Our team of exceptional individuals brings a wealth of expertise, creativity, and passion to this transformative project. Each member plays a critical role in developing innovative solutions to revolutionize parking space management during high-traffic events. Together, we are not only addressing current logistical challenges but also setting new standards for efficiency and sustainability in event management. Our team's diverse skills and unwavering commitment ensure that Project SouthPark is at the forefront of technological advancements in this field. Allow us to introduce the brilliant team shaping the future of event logistics, dedicated to making every event at Messe München smoother and more efficient.",
};

const ABOUT_PROJECT = {
  headline: "About the Project",
  subheadings: [
    {
      title: "Project SouthPark: Innovating Event Parking Management",
      description:
        "Project SouthPark is a collaborative initiative between Messe München and students from the MMT program at LMU Munich. Our goal is to create a state-of-the-art MVP that transforms parking space allocation during high-traffic events. We are committed to delivering a seamless, efficient, and user-friendly PSMS that meets the logistical needs of Messe München’s major events.",
    },
    {
      title: "Hands-On Learning and Real-World Impact",
      description:
        "For the students involved, Project SouthPark offers a hands-on learning experience that bridges academic theory with practical application. This project allows us to tackle real-world challenges in event management, providing valuable skills for our future careers. Messe München gains innovative solutions to streamline their event logistics, making this partnership beneficial for both parties.",
    },
    {
      title: "Innovative Solutions for Complex Challenges",
      description:
        "The core of Project SouthPark lies in developing innovative solutions to manage parking spaces during high-traffic events. Our team uses advanced technologies and methodologies to design a robust, flexible system. By prioritizing user experience, operational efficiency, and scalability, we ensure our solutions meet the evolving needs of Messe München and support future growth.",
    },
    {
      title: "A Commitment to Excellence and Sustainability",
      description:
        "Excellence and sustainability are fundamental to Project SouthPark. Our goal is to deliver a high-quality PSMS that enhances operational efficiency while promoting sustainable practices. By optimizing parking space usage and reducing congestion, we aim to create a more environmentally friendly event management process. Our commitment to excellence ensures that every aspect of the project is thoroughly planned and executed.",
    },
    {
      title: "About the Program",
      description:
        "The Management & Digital Technologies (MMT) program at LMU Munich blends management studies with digital technology education. Led by Prof. Dr. Johann Kranz, the Professorship of Digital Services and Sustainability explores digital innovation and sustainability. The 'Management & Digital Technologies II - Digital Innovation Lab' course provides students with hands-on experience in applying web technologies to solve real-world business problems using agile methodologies.",
    },
  ],
};
const TEAM_MEMBERS = [
  {
    name: "Jakob Schwarz",
    img: tolkien,
    position: "Full Stack Innovator & Backend Guru",
    linkedIn: "https://www.linkedin.com/in/schwarzjakob/",
    email: "mailto:jakob.schwarz@campus.lmu.de",
  },
  {
    name: "Timon Tirtey",
    img: kenny,
    position: "Full Stack Innovator & UI/UX Master",
    linkedIn: "https://www.linkedin.com/in/timontirtey/",
    email: "mailto:t.tirtey@campus.lmu.de",
  },
  {
    name: "Nichole Chen",
    img: tuong,
    position: "Dev Innovator & Review Champion",
    linkedIn: "https://www.linkedin.com/in/pei-lin-chen-658836184/",
    email: "mailto:pei.chen@campus.lmu.de",
  },

  {
    name: "Sven Tiefenthaler",
    img: eric,
    position: "Data Innovator & Optimization Wizard",
    linkedIn: "https://www.linkedin.com/in/sven-tiefenthaler-a7617221b/",
    email: "mailto:s.tiefenthaler@campus.lmu.de",
  },
];

const renderTeam = () => {
  return (
    <Container className="outer-container">
      <Grid container className="inner-container">
        <Grid item xs={12} md={4} className="headings-container">
          <Typography variant="h3" className="heading-text">
            {CONTENT.headline}
          </Typography>

          <Typography variant="body1" className="sub-heading-text">
            {CONTENT.description}
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
                  <Typography variant="body2" className="position center">
                    {member.position}
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
        <Grid item xs={12}>
          <Typography
            textAlign="left"
            marginBottom="1.5rem"
            variant="h4"
            fontWeight="bold"
            className="section-title"
          >
            After Movie
          </Typography>
          <div style={iframeContainerStyle}>
            <iframe
              style={iframeStyle}
              src="https://www.youtube.com/embed/aKIz6rKQoCw?si=aHi_BXNF5RlrHodt"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            ></iframe>
          </div>
        </Grid>
        <Grid
          display="flex"
          flexDirection="column"
          marginTop="2rem"
          item
          xs={12}
          className="about-project-container"
        >
          <Typography
            textAlign="left"
            marginBottom="1rem"
            variant="h4"
            fontWeight="bold"
            className="about-project-heading"
          >
            {ABOUT_PROJECT.headline}
          </Typography>
          {ABOUT_PROJECT.subheadings.map((section, index) => (
            <div key={index} className="about-project-section">
              <Typography
                textAlign="left"
                marginBottom="0.5rem"
                variant="h6"
                fontWeight="bold"
                className="section-title"
              >
                {section.title}
              </Typography>
              <Typography
                marginBottom="0.5rem"
                variant="body1"
                className="section-description"
                textAlign="justify"
              >
                {section.description}
              </Typography>
            </div>
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
