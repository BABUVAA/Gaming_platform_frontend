import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Accordion.css';

const Accordion = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="accordion">
      {items.map((item, index) => (
        <div key={index}>
          <button
            className="accordion-header"
            onClick={() => toggleAccordion(index)}
          >
            {item.title}
          </button>
          {activeIndex === index && (
            <div className="accordion-body">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
};

Accordion.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Accordion;
