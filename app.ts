import chalk from 'chalk';
import inquirer from 'inquirer';
import ytdl, { videoFormat } from 'ytdl-core';
import fs from 'fs';
import * as p from '@clack/prompts';
import cp from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import os from 'os';

// Define a type for video formats
type VideoFormat = videoFormat & {
  hasVideo: boolean;
  hasAudio: boolean;
};

function setSanitizeFilename(filename: string): string {
  return filename.replace(/[\\/:"*?<>|]+/g, '_');
}

function getMainDownloadFolder(): string {
  const mainDownloadFolder = path.join(os.homedir(), 'Downloads');
  return mainDownloadFolder;
}

async function downloadVideo(url: string, name: string, resolution: string, permission: boolean): Promise<void> {
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
        new Promise<void>((resolve, reject) => {
          video.pipe(videoStream);
          videoStream.on('finish', resolve);
          videoStream.on('error', reject);
        }),
        new Promise<void>((resolve, reject) => {
          audio.pipe(audioStream);
          audioStream.on('finish', resolve);
          audioStream.on('error', reject);
        }),
      ]);
      await mergeAudioAndVideo(videoFilePath, audioFilePath, outputFilePath);

      // Delete the video and audio files
      fs.unlinkSync(videoFilePath);
      fs.unlinkSync(audioFilePath);
      // Get the main download folder and move the video
      const mainDownloadFolder = getMainDownloadFolder();
      const finalOutputFilePath = path.join(mainDownloadFolder, `${sanitizedFilename}.mp4`);
      fs.renameSync(outputFilePath, finalOutputFilePath);
    } catch (err: any) {
      console.error('Error:', err.message);
    }
  } else {
    console.error('Permission denied to download the video.');
  }
}

function getFormatCode(formats: VideoFormat[], resolution: string): string | null {
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
// Define a types for the mergeAudioAndVideo function
type MergeAudioAndVideo = (videoPath: string, audioPath: string, outputPath: string) => Promise<void>;

async function mergeAudioAndVideo(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
  const ffmpegProcess = cp.spawn(ffmpegPath, [
    '-i', videoPath,
    '-i', audioPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    outputPath,
  ]);

  return new Promise<void>((resolve, reject) => {
    ffmpegProcess.on('close', (code: number) => {
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

// Define a type for the playlist item
interface PlaylistItem {
  url: string;
  title: string;
  formats: VideoFormat[];
}

async function downloadPlaylist(playlistUrl: string, permission: boolean): Promise<void> {
  if (permission) {
    try {
      // Get the playlist info
      const playlistInfo = await ytdl.getPlaylist(playlistUrl);
      const mainDownloadFolder = getMainDownloadFolder();

      for (const videoInfo of playlistInfo as PlaylistItem[]) {
        const url = videoInfo.url;
        const name = videoInfo.title;
        const resolution = '1080p'; // You can customize this if needed

        console.log(chalk.green(`Downloading video: ${name}`));

        const sanitizedFilename = setSanitizeFilename(name);
        const videoFilePath = `./videos/${sanitizedFilename}_video.mp4`;
        const audioFilePath = `./videos/${sanitizedFilename}_audio.mp3`;
        const outputFilePath = `./videos/${sanitizedFilename}.mp4`;

        const videoStream = fs.createWriteStream(videoFilePath);
        const audioStream = fs.createWriteStream(audioFilePath);

        const formatCode = getFormatCode(videoInfo.formats, resolution);
        if (!formatCode) {
          console.error('Could not find a suitable format for download.');
          continue; // Skip this video and move to the next
        }

        const video = ytdl(url, { quality: formatCode });
        const audio = ytdl(url, { quality: 'highestaudio' });

        // Use Promise.all to download both audio and video concurrently
        await Promise.all([
          new Promise<void>((resolve, reject) => {
            video.pipe(videoStream);
            videoStream.on('finish', resolve);
            videoStream.on('error', reject);
          }),
          new Promise<void>((resolve, reject) => {
            audio.pipe(audioStream);
            audioStream.on('finish', resolve);
            audioStream.on('error', reject);
          }),
        ]);

        await mergeAudioAndVideo(videoFilePath, audioFilePath, outputFilePath);

        // Delete the video and audio files
        fs.unlinkSync(videoFilePath);
        fs.unlinkSync(audioFilePath);

        // Move the video to the main download folder
        const finalOutputFilePath = path.join(mainDownloadFolder, `${sanitizedFilename}.mp4`);
        fs.renameSync(outputFilePath, finalOutputFilePath);

        console.log(chalk.green(`Downloaded video: ${name}`));
      }

      console.log(chalk.green('Playlist download completed.'));
    } catch (err) {
      console.error('Error:', err.message);
    }
  } else {
    console.error('Permission denied to download the playlist.');
  }
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

async function displayMenu(): Promise<void> {
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
      const { playlistUrl } = await inquirer.prompt([
        {
          type: 'input',
          name: 'playlistUrl',
          message: 'Enter the URL of the playlist you want to download:',
        },
      ]);

      const { permission: playlistPermission } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'permission',
          message: 'Do you want to download the playlist in the main download folder on your computer?',
        },
      ]);

      console.log(chalk.overline('\nDownloading playlist is starting...'));
      const playlistSpinner = p.spinner();
      playlistSpinner.start();
      await downloadPlaylist(playlistUrl, playlistPermission);
      playlistSpinner.stop();
      console.log('Done....');
      break;

    case 'exit':
      console.log(chalk.yellow('Exiting...'));
      break;

    default:
      console.log(chalk.red('Invalid choice. Please select a valid option.'));
  }
}

displayMenu();
