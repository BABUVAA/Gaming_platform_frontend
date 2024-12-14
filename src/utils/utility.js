import { useLocation, useNavigate } from "react-router-dom";

//HANDLES POPOVER API
export const popover_toggle = (id) => {
  document.getElementById(id).hidePopover();
};

//HANDLES FORMS DATA
export const formData = (event) => {
  //get the values from the form
  const formData = new FormData(event.target);
  return Object.fromEntries(formData);
};
