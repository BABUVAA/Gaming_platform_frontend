import { Form, redirect } from "react-router-dom";
import Input from "../components/ui/Input/Input";
import Button from "../components/ui/Button/Button";

const ForgotPassword = () => {
  return (
    <>
      <div className="col js-c as-c p-l gap bs">
        <h3 className="tc m-b-m">E - GAMING</h3>
        <h5 className="tc m-b-s">Reset you password</h5>
        <h6>Please fill out the fields below to reset your password</h6>
        <Form method="POST" className="col gap m-b-s">
          <Input
            type="email"
            varient="m-b-s"
            placeholder="Email"
            name="email"
          />
          <Button type="submit solid" width="100%" className="form-btn">
            Reset Password
          </Button>
        </Form>
      </div>
    </>
  );
};

export async function forgotPassword(data) {
  const formData = await data.request.formData();
  const logData = Object.fromEntries(formData);
  console.log(logData); // This will log the user data to the console
  return redirect("/"); // Redirect after logging
}

export default ForgotPassword;
