from pydantic import BaseModel, Field

class QuestionRequest(BaseModel):
    topic_id: str = Field(..., description="The unique ID of the topic block generated during the PPTX upload.")
    question: str = Field(..., description="The exact question asked by the student regarding the topic text.")