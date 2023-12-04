import reactLogo from "../assets/react.svg";
import viteLogo from "/vite.svg";

/*
This is the first page of the webtutor.
It is displayed when the user opens the webtutor.
It contains a short introduction of the webtutor
and the logos of vite and react.
*/
function StartPage() {
  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      {window.innerWidth < window.innerHeight && (
        <p className="read-the-docs">
          Consider using landscape mode for the best experience!
        </p>
      )}
    </>
  );
}

export default StartPage;
