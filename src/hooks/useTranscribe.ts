import {
  StartStreamTranscriptionCommand,
  TranscribeStreamingClient,
  TranscriptEvent,
} from "@aws-sdk/client-transcribe-streaming";
import {
  TranslateClient,
  TranslateTextCommand,
} from "@aws-sdk/client-translate";
import update from "immutability-helper";

import MicrophoneStream from "microphone-stream";

import * as process from "process";
import { useCallback, useEffect, useMemo, useState } from "react";
window.process = process;
// import { Buffer } from "buffer";
window.Buffer = window.Buffer || require("buffer").Buffer;

const pcmEncodeChunk = (chunk: any) => {
  const input = MicrophoneStream.toRaw(chunk);
  let offset = 0;
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return Buffer.from(buffer);
};

const useTranscribe = () => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [prevTranscript, setPrevTranscript] = useState<string>("");
  const [translatedScript, setTranslatedScript] = useState<string[]>([]);

  const transcribeClient = new TranscribeStreamingClient({
    region: process.env.REACT_APP_REGION,
    credentials: {
      accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY ?? "",
    },
  });

  const translateClient = new TranslateClient({
    region: process.env.REACT_APP_REGION,
    credentials: {
      accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY ?? "",
    },
  });

  const [micStream, setMicStream] = useState<MicrophoneStream>(
    new MicrophoneStream()
  );

  const audioStream = useCallback(
    async function* () {
      for await (const chunk of micStream as any) {
        yield {
          AudioEvent: {
            AudioChunk:
              pcmEncodeChunk(
                chunk
              ) /* pcm Encoding is optional depending on the source */,
          },
        };
      }
    },
    [micStream]
  );

  const transciptionCommand = useMemo(
    () =>
      new StartStreamTranscriptionCommand({
        // The language code for the input audio. Valid values are en-GB, en-US, es-US, fr-CA, and fr-FR
        LanguageCode: "en-US",
        // The encoding used for the input audio. The only valid value is pcm.
        MediaEncoding: "pcm",
        // The sample rate of the input audio in Hertz. We suggest that you use 8000 Hz for low-quality audio and 16000 Hz for
        // high-quality audio. The sample rate must match the sample rate in the audio file.
        MediaSampleRateHertz: 44100,
        AudioStream: audioStream(),
      }),
    [audioStream]
  );

  useEffect(() => {
    const index = transcript.length - 1;
    if (transcript.length > 0 && prevTranscript !== transcript[index]) {
      console.log("translate", transcript[index]);

      const command = new TranslateTextCommand({
        SourceLanguageCode: "en",
        TargetLanguageCode: "ja",
        Text: transcript[index],
      });

      translateClient.send(command).then((res) => {
        setTranslatedScript((prev) => {
          const tmp = update(prev, {
            $splice: [[index, 1, res.TranslatedText ?? ""]],
          });
          return tmp;
        });
      });
      setPrevTranscript(transcript[index]);
    }
  }, [transcript]);

  return {
    start: () => {
      // setMicStream(new MicrophoneStream());
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
        })
        .then((stream) => {
          micStream.setStream(stream);
        });

      let prevTime = 0;
      let transcriptIndex = -1;
      transcribeClient.send(transciptionCommand).then(async (response) => {
        // This snippet should be put into an async function
        for await (const event of response.TranscriptResultStream as any) {
          if (event.TranscriptEvent) {
            // Get multiple possible results
            const results = event.TranscriptEvent.Transcript?.Results;

            // eslint-disable-next-line no-loop-func
            results?.forEach((result: any) => {
              (result.Alternatives || []).forEach((alternative: any) => {
                const time = Math.min(
                  ...alternative.Items.map((item: any) => item.StartTime)
                );

                if (prevTime !== time) {
                  transcriptIndex++;
                  prevTime = time;
                }

                setTranscript((prev) => {
                  const tmp = update(prev, {
                    $splice: [[transcriptIndex, 1, alternative.Transcript]],
                  });
                  return tmp;
                });
              });
            });
          }
        }
      });
    },
    stop: () => {
      // client.destroy();
      micStream.stop();
      setMicStream(new MicrophoneStream());
    },
    transcript,
    translatedScript,
  };
};
export default useTranscribe;
