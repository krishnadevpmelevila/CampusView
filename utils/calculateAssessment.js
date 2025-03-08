const Assessment = require('../models/assessmentSchema');

async function calculateAssessment(assessmentId) {
    try {
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            return { message: "Assessment not found!" };
        }

        let coScores = {};
        let coTotalMarks = {};

        // Iterate through tools and questions
        assessment.tools.forEach(tool => {
            tool.questions.forEach(question => {
                const coNumber = question.coNumber;
                const maxMarks = parseFloat(question.maxMarks) || 0;

                if (!coScores[coNumber]) {
                    coScores[coNumber] = 0;
                    coTotalMarks[coNumber] = 0;
                }

                coScores[coNumber] += maxMarks;
                coTotalMarks[coNumber] += 10; // Assuming CO attainment is scaled to 10
            });
        });

        // Compute CO Attainment Percentage
        let coAttainment = {};
        Object.keys(coScores).forEach(co => {
            coAttainment[co] = ((coScores[co] / coTotalMarks[co]) * 100).toFixed(2) + "%";
        });

        return {
            assessmentId,
            coAttainment
        };

    } catch (error) {
        console.error("Error in assessment calculation:", error);
        return { message: "Internal Server Error", error: error.message };
    }
}

module.exports = calculateAssessment;
