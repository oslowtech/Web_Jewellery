import { useEffect } from "react";

const setMeta = (selector, content) => {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute("content", content);
  }
};

const usePageMeta = ({ title, description, image }) => {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:description"]', description);
    }
    if (title) {
      setMeta('meta[property="og:title"]', title);
    }
    if (image) {
      setMeta('meta[property="og:image"]', image);
    }
  }, [title, description, image]);
};

export default usePageMeta;
