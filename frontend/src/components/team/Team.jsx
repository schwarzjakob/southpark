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

const CONTENT = {
  headline: "Meet the Team Behind Project SouthPark",
  description:
    "Welcome to the SouthPark team page! We are thrilled to introduce you to the dynamic and innovative minds driving the most groundbreaking project in event logistics optimization at Messe München. Our team of exceptional individuals brings a wealth of expertise, creativity, and passion to this transformative project. Each member plays a critical role in developing innovative solutions to revolutionize parking space management during high-traffic events. Together, we are not only addressing current logistical challenges but also setting new standards for efficiency and sustainability in event management. Our team's diverse skills and unwavering commitment ensure that Project SouthPark is at the forefront of technological advancements in this field. Allow us to introduce the brilliant team shaping the future of event logistics, dedicated to making every event at Messe München smoother and more efficient.",
};

const ABOUT_PROJECT = {
  headline: "About the Project",
  subheadings: [
    {
      title: "Project SouthPark: Revolutionizing Event Parking Management",
      description:
        "Project SouthPark is a pioneering collaboration between Messe München and students from the esteemed MMT program at LMU Munich. This initiative is all about crafting a cutting-edge Minimum Viable Product (MVP) to revolutionize parking space allocation during high-traffic events. Our mission is to create a seamless, efficient, and user-friendly Parking Space Management System (PSMS) that not only meets but exceeds the logistical demands of Messe München's premier events. By integrating advanced technology with practical insights, we aim to set new standards in event logistics, ensuring a smooth and hassle-free experience for all attendees.",
    },
    {
      title: "Hands-On Learning and Real-World Impact",
      description:
        "For the talented students involved, Project SouthPark is a unique hands-on learning experience. It bridges academic theory with real-world application, providing an invaluable opportunity to tackle genuine challenges in event management. Students gain practical skills and insights that are directly applicable to their future careers, while Messe München benefits from innovative solutions to streamline their event logistics. This partnership exemplifies how academia and industry can work together to achieve remarkable results, making this collaboration a true win-win.",
    },
    {
      title: "Innovative Solutions for Complex Challenges",
      description:
        "At the heart of Project SouthPark is the development of innovative solutions to address the complex challenges of parking space management during high-traffic events. Our team leverages cutting-edge technologies and methodologies to design a system that is both robust and flexible. By focusing on user experience, operational efficiency, and scalability, we ensure that our solutions can adapt to the evolving needs of Messe München. This forward-thinking approach not only solves current logistical issues but also prepares Messe München for future growth and success.",
    },
    {
      title: "A Commitment to Excellence and Sustainability",
      description:
        "Excellence and sustainability are core values of Project SouthPark. We are committed to delivering a high-quality Parking Space Management System that not only enhances operational efficiency but also promotes sustainable practices. By optimizing parking space usage and reducing congestion, we contribute to a more environmentally friendly event management process. Our dedication to excellence ensures that every aspect of the project is meticulously planned and executed, providing Messe München with a reliable and effective solution for their event logistics needs.",
    },
    {
      title: "About the Program",
      description:
        "The Management & Digital Technologies (MMT) program at Ludwig Maximilian University of Munich (LMU) offers a unique blend of management studies and digital technology education. The Professorship of Digital Services and Sustainability, led by Prof. Dr. Johann Kranz, is dedicated to exploring the intersection of digital innovation and sustainability. The summer term 2024 course, 'Management & Digital Technologies II - Digital Innovation Lab,' provides students with hands-on experience in applying web technologies to solve real-world business problems. This course emphasizes the application of the agile SCRUM methodology, enabling students to manage and organize software development projects effectively while fostering a start-up-like atmosphere of collaboration and innovation.",
    },
  ],
};
const TEAM_MEMBERS = [
  {
    name: "Nichole Chen",
    img: tuong,
    position: "Mastermind of User Experience & Interface Design",
    linkedIn: "https://www.linkedin.com/in/pei-lin-chen-658836184/",
    email: "mailto:pei.chen@campus.lmu.de",
  },
  {
    name: "Jakob Schwarz",
    img: tolkien,
    position: "Architect of Backend Solutions & Data Management",
    linkedIn: "https://www.linkedin.com/in/schwarzjakob/",
    email: "mailto:jakob.schwarz@campus.lmu.de",
  },
  {
    name: "Sven Tiefenthaler",
    img: eric,
    position: "Optimization Algorithm Wizard",
    linkedIn: "https://www.linkedin.com/in/sven-tiefenthaler-a7617221b/",
    email: "mailto:s.tiefenthaler@campus.lmu.de",
  },
  {
    name: "Timon Tirtey",
    img: kenny,
    position: "Frontend Development Guru",
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
