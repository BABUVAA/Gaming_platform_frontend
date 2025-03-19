//HANDLES FORMS DATA
export const formData = (event) => {
  //get the values from the form
  const formData = new FormData(event.target);
  return Object.fromEntries(formData);
};
