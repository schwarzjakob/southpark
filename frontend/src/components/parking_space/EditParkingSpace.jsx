// src/components/parking_space/EditParkingSpace.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { Input, Switch, Select, Form } from "antd";
import { Box, Typography, Paper, Button } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import GarageIcon from "@mui/icons-material/GarageRounded";
import RoofingRoundedIcon from "@mui/icons-material/RoofingRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AddRoadRoundedIcon from "@mui/icons-material/AddRoadRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";

const { Option } = Select;

const EditParkingSpace = () => {
  const [parkingSpace, setParkingSpace] = useState({
    name: "",
    service_toilets: false,
    surface_material: "Asphalt",
    service_shelter: false,
    pricing: "low",
    external: false,
  });

  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const id = query.get("id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/parking_spaces/${id}`
        );
        setParkingSpace(response.data);
      } catch (error) {
        console.error("Error fetching parking space data", error);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParkingSpace({
      ...parkingSpace,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (name, value) => {
    setParkingSpace({
      ...parkingSpace,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:5000/parking_spaces/${id}`,
        parkingSpace
      );
      console.log("Parking space updated:", response.data);
      navigate("/parking_spaces");
    } catch (error) {
      console.error("Error updating parking space:", error);
    }
  };

  return (
    <Box className="editParkingSpace-form">
      <Paper className="editParkingSpace-container">
        <Box className="iconHeadline__container">
          <GarageIcon className="demandTable__icon" />
          <Typography variant="h4" gutterBottom className="demandTable__title">
            Edit Parking Lot
          </Typography>
        </Box>
        <Form layout="vertical" onSubmitCapture={handleSubmit}>
          <Form.Item label="Name">
            <Box className="editParkingSpace-item">
              <GarageIcon className="editParkingSpace-icon" />
              <Input
                name="name"
                value={parkingSpace.name}
                onChange={handleChange}
              />
            </Box>
          </Form.Item>
          <Form.Item label="Type">
            <Box className="editParkingSpace-item">
              <PlaceRoundedIcon className="editParkingSpace-icon" />
              <Select
                value={parkingSpace.external ? "External" : "Internal"}
                onChange={(value) =>
                  handleSelectChange("external", value === "External")
                }
              >
                <Option value="Internal">Internal</Option>
                <Option value="External">External</Option>
              </Select>
            </Box>
          </Form.Item>
          <Form.Item label="Surface">
            <Box className="editParkingSpace-item">
              <AddRoadRoundedIcon className="editParkingSpace-icon" />
              <Select
                value={parkingSpace.surface_material}
                onChange={(value) =>
                  handleSelectChange("surface_material", value)
                }
              >
                <Option value="Asphalt">Asphalt</Option>
                <Option value="Gravel">Gravel</Option>
                <Option value="Dirt">Dirt</Option>
              </Select>
            </Box>
          </Form.Item>
          <Form.Item label="Pricing">
            <Box className="editParkingSpace-item">
              <AttachMoneyRoundedIcon className="editParkingSpace-icon" />
              <Select
                value={parkingSpace.pricing}
                onChange={(value) => handleSelectChange("pricing", value)}
              >
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
              </Select>
            </Box>
          </Form.Item>
          <Form.Item label="Toilets" valuePropName="checked">
            <Box className="editParkingSpace-item">
              <WcRoundedIcon className="editParkingSpace-icon" />
              <Switch
                name="service_toilets"
                checked={parkingSpace.service_toilets}
                onChange={(checked) =>
                  handleSelectChange("service_toilets", checked)
                }
              />
            </Box>
          </Form.Item>
          <Form.Item label="Shelter" valuePropName="checked">
            <Box className="editParkingSpace-item">
              <RoofingRoundedIcon className="editParkingSpace-icon" />
              <Switch
                name="service_shelter"
                checked={parkingSpace.service_shelter}
                onChange={(checked) =>
                  handleSelectChange("service_shelter", checked)
                }
              />
            </Box>
          </Form.Item>
          <Form.Item>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              style={{ float: "right" }}
            >
              Save
            </Button>
          </Form.Item>
        </Form>
      </Paper>
    </Box>
  );
};

export default EditParkingSpace;
