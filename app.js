import chalk from 'chalk';
import inquirer from 'inquirer';
import ytdl from 'ytdl-core';
import fs from 'fs';
import * as p from '@clack/prompts';
import cp from 'child_process';
import ffmpegPath from 'ffmpeg-static';


function setSanitizeFilename(filename) {
    // Replace invalid characters with underscores
    return filename.replace(/[\\/:"*?<>|]+/g, '_');
}

async function downloadVideo(url, name, resolution, permission) {
  if (permission) {
    try {
      const info = await ytdl.getInfo(url);
      const formatCode = getFormatCode(info.formats, resolution);
      
      if (!formatCode) {
        throw new Error('Could not find a suitable format for download.');
      }

      const video = ytdl(url, { quality: formatCode });
      const audio = ytdl(url, { quality: 'highestaudio' });
      const sanitizedFilename = setSanitizeFilename(name);
      const videoFilePath = `./videos/${sanitizedFilename}_video.mp4`;
      const audioFilePath = `./videos/${sanitizedFilename}_audio.mp3`;
      const outputFilePath = `./videos/${sanitizedFilename}.mp4`;

      const videoStream = fs.createWriteStream(videoFilePath);
      const audioStream = fs.createWriteStream(audioFilePath);

      // Use Promise.all to download both audio and video concurrently
      await Promise.all([
        new Promise((resolve, reject) => {
          video.pipe(videoStream);
          videoStream.on('finish', resolve);
          videoStream.on('error', reject);
        }),
        new Promise((resolve, reject) => {
          audio.pipe(audioStream);
          audioStream.on('finish', resolve);
          audioStream.on('error', reject);
        }),
      ]);
      await mergeAudioAndVideo(videoFilePath, audioFilePath, outputFilePath);

        // Delete the video and audio files
        fs.unlinkSync(videoFilePath);
        fs.unlinkSync(audioFilePath);
        
    } catch (err) {
      console.error('Error:', err.message);
    }
  } else {
    console.error('Permission denied to download the video.');
  }
}

function getFormatCode(formats, resolution) {
  switch (resolution) {
    case '1080p':
      return '137';
    case '720p':
      return '136';
    case '480p':
      return '135';
    default:
      return null;
  }
}

async function mergeAudioAndVideo(videoPath, audioPath, outputPath) {
  const ffmpegProcess = cp.spawn(ffmpegPath, [
    '-i', videoPath,
    '-i', audioPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    outputPath,
  ]);

  return new Promise((resolve, reject) => {
    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`FFmpeg process exited with code ${code}`);
      }
    });

    ffmpegProcess.stderr.on('data', (data) => {
    });
  });
}

const menuChoices = [
  {
    name: 'Download Video',
    value: 'video',
  },
  {
    name: 'Download Playlist',
    value: 'playlist',
  },
  {
    name: 'Exit',
    value: 'exit',
  },
];

async function displayMenu() {
  console.log(chalk.bold.red(`Welcome to the Yt DownLoader  🦄  Menu:`));

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select an option:',
      choices: menuChoices,
    },
  ]);

  switch (choice) {
    case 'video':
      const { url } = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Enter the URL of the video you want to download:',
        },
      ]);

      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter the name of the video:',
        },
      ]);

      const { resolution } = await inquirer.prompt([
        {
          type: 'list',
          name: 'resolution',
          message: 'Select the resolution of the video:',
          choices: ['1080p', '720p', '480p'],
        },
      ]);

      const { permission } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'permission',
          message: 'Do you want to download the video in the main download folder on your computer?',
        },
      ]);

      console.log(chalk.overline('\nDownloading is starting...'));
      const spinner = p.spinner();
      spinner.start();
      await downloadVideo(url, name, resolution, permission);
      spinner.stop();
      console.log('Done....');
      break;

    case 'playlist':
      console.log(chalk.green('Playing playlist...'));
      break;

    case 'exit':
      console.log(chalk.yellow('Exiting...'));
      break;

    default:
      console.log(chalk.red('Invalid choice. Please select a valid option.'));
  }
}

displayMenu();
