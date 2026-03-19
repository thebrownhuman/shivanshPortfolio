import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import { useEffect } from "react";
import HoverLinks from "./HoverLinks";

const SocialIcons = () => {
  useEffect(() => {
    const social = document.getElementById("social") as HTMLElement;
    const rafIds: number[] = [];
    const listeners: Array<{ target: EventTarget; event: string; handler: (e: any) => void }> = [];

    social.querySelectorAll("span").forEach((item) => {
      const elem = item as HTMLElement;
      const link = elem.querySelector("a") as HTMLElement;

      let mouseX = 0;
      let mouseY = 0;
      let currentX = 0;
      let currentY = 0;

      const updatePosition = () => {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        link.style.setProperty("--siLeft", `${currentX}px`);
        link.style.setProperty("--siTop", `${currentY}px`);

        const id = requestAnimationFrame(updatePosition);
        rafIds.push(id);
      };

      const onMouseMove = (e: MouseEvent) => {
        // Recalculate rect on every move to avoid stale coordinates after scroll/resize
        const rect = elem.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 40 && x > 10 && y < 40 && y > 5) {
          mouseX = x;
          mouseY = y;
        } else {
          mouseX = rect.width / 2;
          mouseY = rect.height / 2;
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      listeners.push({ target: document, event: "mousemove", handler: onMouseMove });

      // Initialize position from current rect
      const initRect = elem.getBoundingClientRect();
      mouseX = initRect.width / 2;
      mouseY = initRect.height / 2;

      const id = requestAnimationFrame(updatePosition);
      rafIds.push(id);
    });

    return () => {
      rafIds.forEach((id) => cancelAnimationFrame(id));
      listeners.forEach(({ target, event, handler }) =>
        target.removeEventListener(event, handler)
      );
    };
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span>
          <a href="https://github.com/thebrownhuman" target="_blank" rel="noopener noreferrer">
            <FaGithub />
          </a>
        </span>
        <span>
          <a href="https://www.linkedin.com/in/thebrownhuman/" target="_blank" rel="noopener noreferrer">
            <FaLinkedinIn />
          </a>
        </span>
        <span>
          <a href="https://www.instagram.com/thebrownhuman/" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
        </span>
      </div>
      <a className="resume-button" href="#">
        <HoverLinks text="RESUME" />
        <span>
          <TbNotes />
        </span>
      </a>
    </div>
  );
};

export default SocialIcons;
