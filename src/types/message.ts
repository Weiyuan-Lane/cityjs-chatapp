type GroundingLink = {
  text: string;
  url: string;
};

type MessageMetadata = {
  grounding?: {
    links: GroundingLink[];
  };
};

type Message = {
  content: string;
  timestamp: Date;
  self: boolean;
  metadata?: MessageMetadata;
};

export { Message, MessageMetadata, GroundingLink };
