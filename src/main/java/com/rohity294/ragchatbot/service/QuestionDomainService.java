package com.rohity294.ragchatbot.service;

import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class QuestionDomainService {

    private static final Set<String> HR_KEYWORDS = Set.of(
            "hr", "human resources", "employee", "manager", "workplace", "policy", "policies",
            "leave", "pto", "vacation", "sick leave", "holiday", "attendance", "timesheet",
            "pay", "salary", "payroll", "compensation", "compensated", "reimburse", "reimbursement",
            "expense", "claim", "benefits", "insurance", "stipend", "allowance",
            "office", "home office", "wfh", "work from home", "remote work", "hybrid",
            "onboarding", "offboarding", "resignation", "notice period", "probation",
            "appraisal", "performance", "promotion", "training", "code of conduct", "grievance"
    );

    public boolean isValidHrQuestion(String question) {
        if (question == null || question.isBlank()) {
            return false;
        }

        String normalized = question.toLowerCase();
        for (String keyword : HR_KEYWORDS) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}