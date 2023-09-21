import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs";
import * as p from "@clack/prompts";
import ytdl from "ytdl-core"; // import ytdl-core module
import fs from "fs";
import ytdl from "ytdl-core"; // import ytdl-core module

async function downloadVideo(url: string, name: string, resolution: string, permission: boolean) {
  if (permission) {
    try {
      const info = await ytdl.getInfo(url);
      const format = ytdl.chooseFormat(info.formats, {
        quality: resolution === "1080p" ? "highestvideo" : resolution,
      });

      if (!format) {
        throw new Error("Could not find a suitable format for download.");
      }

      const video = ytdl(url, { format });
      const outputFilePath = `./videos/${name}.mp4`;

      video.pipe(fs.createWriteStream(outputFilePath));

      video.on("end", () => {
        console.log(`\n Video downloaded successfully `);
      });

      video.on("error", (err: any) => {
        console.error("\n Error downloading video:", err);
      });
    } catch (err) {
      console.error("\n Error getting video info:", err);
    }
  } else {
    console.error("\n Permission denied to download the video.");
  }
}

    } catch (err) {
      console.error("\n Error getting video info:");
    }
  } else {
    console.error("\n Permission denied to download the video.");
  }
}

const menuChoices = [
  {
    name: "Download Video",
    value: "video",
  },
  {
    name: "Download Playlist",
    value: "playlist",
  },
  {
    name: "Exit",
    value: "exit",
  },
];

async function displayMenu() {
  console.log(chalk.bold.red("Welcome to the Yt DownLoader Menu:"));

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Select an option:",
      choices: menuChoices,
    },
  ]);

  switch (choice) {
    case "video":
      const { url } = await inquirer.prompt([
        {
          type: "input",
          name: "url",
          message: "Enter the url of the video you want to download",
        },
      ]);
      const { name } = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Enter the name of the video",
        },
      ]);
      const { resolution } = await inquirer.prompt([
        {
          type: "list",
          name: "resolution",
          message: "Enter the resolution of the video",
          choices: ["1080p", "720p", "480p"],
        },
      ]);
      const { permission } = await inquirer.prompt([
        {
          type: "confirm",
          name: "permission",
          message:
            "Do you want to download the video in the main download folder in your computer",
        },
      ]);
      console.log(chalk.whiteBright("\n downloading is starting..."));
      const spiner = p.spinner();

      spiner.start();
      await downloadVideo(url, name, resolution, permission);
      spiner.stop();
      break;
    case "playlist":
      console.log(chalk.green("Playing playlist..."));
      break;
    case "exit":
      console.log(chalk.yellow("Exiting..."));
      break;
    default:
      console.log(chalk.red("Invalid choice. Please select a valid option."));
  }
}

displayMenu();
