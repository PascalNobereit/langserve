import { toast } from "react-toastify";
import ThumbsUpIcon from "../../assets/ThumbsUpIcon.svg?react";
import ThumbsDownIcon from "../../assets/ThumbsDownIcon.svg?react";
import CircleSpinIcon from "../../assets/CircleSpinIcon.svg?react";
import CheckCircleIcon2 from "../../assets/CheckCircleIcon2.svg?react";
import XCircle from "../../assets/XCircle.svg?react";

import { resolveApiUrl } from "../../utils/url";
import { useState } from "react";
import useSWRMutation from "swr/mutation";

const useFeedbackMutation = (runId: string, onError?: (e: any) => void) => {
  interface FeedbackArguments {
    key: string;
    score: number;
    comment: string;
  }

  const [lastArg, setLastArg] = useState<FeedbackArguments | null>(null);

  const mutation = useSWRMutation(
    ["feedback", runId],
    async ([, runId], { arg }: { arg: FeedbackArguments }) => {
      const payload = { run_id: runId, key: arg.key, score: arg.score, comment: arg.comment };
      setLastArg(arg);

      const request = await fetch(resolveApiUrl("/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!request.ok) {
        if (request.status === 404) {
          onError?.(new Error(`Feedback endpoint not found. Please enable it in your LangServe endpoint.`));
        } else {
          try {
            const errorResponse = await request.json();
            onError?.(new Error(`${errorResponse.detail}`));
          } catch (e) {
            onError?.(new Error(`Request failed with status: ${request.status}`));
          }
        }
        throw new Error(`Failed request ${request.status}`)
      }
      const json: {
        id: string;
        score: number;
      } = await request.json();

      toast("Feedback gesendet!", { hideProgressBar: true });
      return json;
    }
  );

  return { lastArg: mutation.isMutating ? lastArg : null, mutation };
};

export function CorrectnessFeedback(props: { runId: string, onError?: (e: any) => void }) {
  const [comment, setComment] = useState('');
  const score = useFeedbackMutation(props.runId, props.onError);

  if (props.runId == null) return null;
  return (
    <>
      <button
        type="button"
        className={"bg-background rounded p-1 hover:opacity-80"}
        disabled={score.mutation.isMutating}
        onClick={() => {
          if (score.mutation.data?.score !== 1) {
            score.mutation.trigger({ key: "correctness", score: 1, comment });
          }
        }}
      >
        {score.lastArg?.score === 1 ? (
          <CircleSpinIcon className="animate-spin w-4 h-4 text-white/50 fill-white" />
        ) : (
          (score.mutation.data?.score !== 1
            ? <ThumbsUpIcon className="w-4 h-4" />
            : <CheckCircleIcon2 className="w-4 h-4 stroke-teal-500" />)
        )}
      </button>

      <button
        type="button"
        className={"bg-background rounded p-1 hover:opacity-80"}
        disabled={score.mutation.isMutating}
        onClick={() => {
          if (score.mutation.data?.score !== 0) {
            score.mutation.trigger({ key: "correctness", score: 0, comment });
          }
        }}
      >
        {score.lastArg?.score === 0 ? (
          <CircleSpinIcon className="animate-spin w-4 h-4 text-white/50 fill-white" />
        ) : (
          (score.mutation.data?.score !== 0
            ? <ThumbsDownIcon className="w-4 h-4" />
            : <XCircle className="w-4 h-4 stroke-red-500" />)
        )}
      </button>
      <div className="flex items-center space-x-2">
  <textarea
    className="bg-background rounded p-1 w-full resize-none"  // Added 'resize-none' class to prevent manual resizing
    placeholder="Bitte gib uns Feedback..."
    value={comment}
    onChange={(e) => setComment(e.target.value)}
  />
  <button
    type="button"
    className={"bg-background rounded p-1 hover:opacity-80"}
    disabled={score.mutation.isMutating}
    onClick={() => {
      if (comment.trim()) {
        score.mutation.trigger({ key: "correctness", score: 0.5, comment });
      }
    }}
  >
    {score.mutation.isMutating ? (
      <CircleSpinIcon className="animate-spin w-4 h-4 text-white/50" />
    ) : (
      <CheckCircleIcon2 className="w-4 h-4 stroke-teal-500" />
    )}
  </button>
</div>
    </>
  );
}