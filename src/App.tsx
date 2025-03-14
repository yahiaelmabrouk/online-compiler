import React, { useState, useEffect } from "react";
import { Code2, Play, Sun, Moon } from "lucide-react";
import { loadPyodide } from "pyodide";

type Language = "javascript" | "python";

function App() {
  const [code, setCode] = useState("// Start coding here...");
  const [language, setLanguage] = useState<Language>("javascript");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [output, setOutput] = useState("");
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function initPyodide() {
      try {
        setIsLoading(true);
        const pyodideInstance = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
        });
        setPyodide(pyodideInstance);
      } catch (error) {
        console.error("Failed to load Pyodide:", error);
      } finally {
        setIsLoading(false);
      }
    }
    initPyodide();
  }, []);

  const handleRunCode = async () => {
    setOutput(""); // Clear previous output

    try {
      if (language === "javascript") {
        // Capture console.log output
        const originalConsoleLog = console.log;
        const logs: string[] = [];

        console.log = (...args) => {
          logs.push(
            args
              .map((arg) =>
                typeof arg === "object"
                  ? JSON.stringify(arg, null, 2)
                  : String(arg)
              )
              .join(" ")
          );
        };

        // Execute the code
        const result = new Function(code)();

        // Restore original console.log
        console.log = originalConsoleLog;

        // Set output
        setOutput(
          logs.join("\n") + (result !== undefined ? "\n=> " + result : "")
        );
      } else if (language === "python") {
        if (!pyodide) {
          setOutput("Python runtime is not ready yet. Please wait...");
          return;
        }

        try {
          // Redirect Python stdout to capture print statements
          pyodide.runPython(`
            import sys
            import io
            sys.stdout = io.StringIO()
          `);

          // Run the actual code
          const result = pyodide.runPython(code);

          // Get captured stdout
          const stdout = pyodide.runPython("sys.stdout.getvalue()");

          // Reset stdout
          pyodide.runPython("sys.stdout = sys.__stdout__");

          // Combine stdout with result if available
          const output =
            stdout + (result !== undefined ? `\n=> ${result}` : "");
          setOutput(output.trim());
        } catch (error: any) {
          setOutput(`Error: ${error.message}`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setOutput(`Error: ${error.message}`);
      } else {
        setOutput("An unknown error occurred");
      }
    }
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setCode(
      newLanguage === "python"
        ? "# Start coding here..."
        : "// Start coding here..."
    );
    setOutput("");
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`px-6 py-4 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } shadow-md`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src="https://img.icons8.com/?size=100&id=16786&format=png&color=000000"
              alt="Developer"
              className="w-6 h-6 rounded-full"
            />
            <h1 className="text-xl font-bold">Online Compiler</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${
                isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Section */}
          <div
            className={`rounded-lg shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {["javascript", "python"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang as Language)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        language === lang
                          ? "bg-blue-500 text-white"
                          : `${
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-100"
                            }`
                      }`}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleRunCode}
                  disabled={language === "python" && (isLoading || !pyodide)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md
                    ${
                      isLoading || (language === "python" && !pyodide)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white`}
                >
                  <Play className="w-4 h-4" />
                  <span>{isLoading ? "Loading Python..." : "Run"}</span>
                </button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full h-[400px] p-4 font-mono text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50"
                }`}
                spellCheck="false"
                placeholder={
                  language === "python"
                    ? "# Start coding here..."
                    : "// Start coding here..."
                }
              />
            </div>
          </div>

          {/* Output Section */}
          <div
            className={`rounded-lg shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Console Output</h2>
            </div>
            <div className="p-4">
              <pre
                className={`h-[400px] p-4 font-mono text-sm rounded-md overflow-auto ${
                  isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50"
                }`}
              >
                {output || "Run your code to see the output here..."}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
