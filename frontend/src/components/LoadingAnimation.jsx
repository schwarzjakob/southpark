import React from "react";

const LoadingAnimation = () => {
  return (
    <div className="loader-container">
      <div className="loader">
        <svg
          className="animated-svg"
          width="110"
          height="60"
          viewBox="0 0 110 60"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M28.2954 34.6805L55.5909 18.8864V25.234L28.2954 41.0388V34.6805ZM28.2954 18.8971L1 34.6805V41.0388L28.2954 25.234V18.8971ZM55.6015 11L1 42.5883V48.9359L55.6015 17.3583V11ZM28.2954 11L1 26.7942V33.1524L28.2954 17.3476V11ZM55.6015 26.7835L28.2954 42.5776V48.9359L55.5909 33.131V26.7835H55.6015Z" />
        </svg>
      </div>
    </div>
  );
};

export default LoadingAnimation;
