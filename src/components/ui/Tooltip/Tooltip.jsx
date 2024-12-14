import React from 'react';
import PropTypes from 'prop-types';
import './Tooltip.css';

const Tooltip = ({ text, children }) => {
  return (
    <div className="tooltip">
      {children}
      <span className="tooltip-text">{text}</span>
    </div>
  );
};

Tooltip.propTypes = {
  text: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default Tooltip;
