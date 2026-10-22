from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from Schemas.study import QuestionRequest
from Utils.nlp import NLP_Methods

app = FastAPI(
    title="Smart Study Assistant API",
    description="Pure Backend API for parsing, summarizing, and querying educational presentations."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

nlp = NLP_Methods()

@app.post('/study/upload')
async def upload_presentation(file: UploadFile = File(...)):
    
    if not (file.filename.lower().endswith('.pptx') or file.filename.lower().endswith('.pdf')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Please upload a .pptx or .pdf file."
        )

    try:
        file_bytes = await file.read()
        processed_data = nlp.process_presentation(file_bytes, file.filename)
        
        if not processed_data:
            raise HTTPException(
                status_code=422, 
                detail="Could not extract usable text from the presentation."
            )
            
        return JSONResponse(status_code=200, content={
            "message": "File processed successfully",
            "data": processed_data
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred while processing the file: {str(e)}"
        )


@app.post('/study/ask')
def ask_question(request: QuestionRequest):
    
    if not nlp.check_topic_exists(request.topic_id):
        raise HTTPException(
            status_code=404, 
            detail="Topic ID not found or session expired. Please re-upload the file."
        )
        
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    topic_text = nlp.get_topic_text(request.topic_id)
    answer = nlp.get_extractive_answer(request.question, topic_text)
    
    if not answer:
        raise HTTPException(
            status_code=404, 
            detail="Could not find a relevant answer in the slides."
        )

    return JSONResponse(status_code=200, content={
        "topic_id": request.topic_id,
        "question": request.question,
        "answer": answer
    })