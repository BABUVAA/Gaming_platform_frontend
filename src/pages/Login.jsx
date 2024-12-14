import { Form } from "react-router-dom";
import { formData } from "../utils/utility";
import { login } from "../store/authSlice";
import { useDispatch } from "react-redux";
import useNavigateHook from "../hooks/useNavigateHook";
import { Button, Input } from "../components";

const Login = () => {
  const { goToDashboard, goToForgetPWD, goToSignUp } = useNavigateHook();
  const dispatch = useDispatch();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loginData = formData(event);
    // Dispatch the login action
    dispatch(login(loginData))
      .unwrap()
      .then(() => {
        // Handle success
        alert("Login successful!");
        goToDashboard();
      })
      .catch((err) => {
        // Handle failure
        console.error("Login failed:", err);
      });
  };

  return (
    <>
      <div className="col yc xc p-l gap  ">
        <Form
          onSubmit={handleSubmit}
          method="POST"
          className="col gap p-4 m-b-s bs bg6 w-min-320 w-max-350"
        >
          <h4 className="tc h4">E - GAMING</h4>
          <label>Username</label>
          <Input type="email" placeholder="Email" name="email" />
          <label>Password</label>
          <Input type="password" placeholder="Password" name="password" />
          <small className="m-b-s txt-muted" onClick={goToForgetPWD}>
            Forgot Password?
          </small>
          <Button type="submit" className="as-c">
            Log in
          </Button>
        </Form>
        <small className="m-b-s ">
          Don't have an account?
          <button onClick={goToSignUp} className="style-none">
            <small className="txt-solid ml-1">Sign up</small>
          </button>
        </small>
      </div>
    </>
  );
};

export default Login;
