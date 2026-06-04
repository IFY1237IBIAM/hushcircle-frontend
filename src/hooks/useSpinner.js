import { useState } from "react";

export default function useSpinner() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  const show = (msg = "") => {
    setMessage(msg);
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
    setMessage("");
  };

  const withSpinner = async (fn, msg = "") => {
    show(msg);
    try {
      return await fn();
    } finally {
      hide();
    }
  };

  return { visible, message, show, hide, withSpinner };
}