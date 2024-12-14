import { Form } from "react-router-dom";
import api from "../api/axios-api";
import { formData } from "../utils/utility";
import { Button, Input } from "../components";

const Admin = () => {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const gameData = formData(event);

    try {
      const response = await api.post("/api/admin/add-new-game", gameData, {
        withCredentials: true,
      });
      if (response.status === 201) {
        console.log("game added");
      }
    } catch (error) {
      // Handle errors
      console.error(
        "adding new game failed",
        error.response?.data || error.message
      );
    }
  };
  return (
    <div>
      <h1>Add Games</h1>
      <Form onSubmit={handleSubmit} method="POST" className="col gap m-b-s">
        <label>ID</label>
        <Input type="text" placeholder="Game ID" name="id" varient="m-b-s" />
        <label>Title</label>
        <Input
          type="text"
          placeholder="Title Image URL"
          name="title"
          varient="m-b-s"
        />
        <label>character</label>
        <Input
          type="text"
          placeholder="Character Image URL"
          name="character"
          varient="m-b-s"
        />
        <label>background</label>
        <Input
          type="text"
          placeholder="Background Image URL"
          name="background"
          varient="m-b-s"
        />
        <label>background color</label>
        <Input
          type="text"
          placeholder="Background Hex"
          name="background_color"
          varient="m-b-s"
        />
        <label>div color</label>
        <Input
          type="text"
          placeholder="Div Hex"
          name="div_color"
          varient="m-b-s"
        />
        <Button type="submit">submit</Button>
      </Form>
    </div>
  );
};
export default Admin;
