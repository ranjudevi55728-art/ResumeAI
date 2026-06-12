"use client";

import React from "react";
import type { Resume } from "../lib/types";

interface ResumeTemplateProps {
  resume: Resume;
}

export function ModernTemplate({ resume }: ResumeTemplateProps) {
  const { personalInfo, summary, education, skills, experience, projects, certifications, languages } = resume;

  return (
    <div className="bg-white text-slate-800 p-8 sm:p-12 shadow-md rounded-lg max-w-4xl mx-auto font-sans leading-relaxed text-sm">
      {/* Header section */}
      <div className="border-b-2 border-slate-800 pb-6 mb-6 text-center">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-800 mb-2">
          {personalInfo.fullName || "Your Full Name"}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.address && <span>• {personalInfo.address}</span>}
          {personalInfo.linkedin && (
            <span>
              • <span className="underline">{personalInfo.linkedin}</span>
            </span>
          )}
          {personalInfo.portfolio && (
            <span>
              • <span className="underline">{personalInfo.portfolio}</span>
            </span>
          )}
        </div>
      </div>

      {/* Summary section */}
      {summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-slate-600 text-sm">{summary}</p>
        </div>
      )}

      {/* Experience section */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">
            Work Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-850 text-sm">
                    {exp.position} <span className="font-normal text-slate-500">at</span> {exp.company}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                  </span>
                </div>
                <p className="text-slate-600 text-xs whitespace-pre-line leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects section */}
      {projects && projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">
            Projects
          </h2>
          <div className="space-y-4">
            {projects.map((proj, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-850 text-sm">{proj.title}</h3>
                  {proj.technologies && (
                    <span className="text-xs text-indigo-600 font-semibold">{proj.technologies}</span>
                  )}
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Education / Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Education */}
        {education && education.length > 0 && (
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-slate-800 text-xs">{edu.school}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs font-semibold">
                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                  </p>
                  {edu.description && <p className="text-slate-500 text-[11px] mt-1">{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Column: Skills / Extras */}
        <div>
          {skills && skills.length > 0 && (
            <div className="mb-4">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-3">
                Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded font-medium border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {certifications && certifications.length > 0 && (
            <div className="mb-4">
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                Certifications
              </h2>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                {certifications.map((cert, idx) => (
                  <li key={idx}>{cert}</li>
                ))}
              </ul>
            </div>
          )}

          {languages && languages.length > 0 && (
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                Languages
              </h2>
              <p className="text-xs text-slate-600 font-medium">{languages.join(", ")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MinimalTemplate({ resume }: ResumeTemplateProps) {
  const { personalInfo, summary, education, skills, experience, projects, certifications, languages } = resume;

  return (
    <div className="bg-white text-[#2a2d34] p-8 sm:p-12 shadow-sm rounded-lg max-w-4xl mx-auto font-mono text-xs leading-relaxed">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#afb3b6] pb-6 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-[#6c757d] text-xs uppercase tracking-widest">Candidate Profile</p>
        </div>
        <div className="space-y-0.5 text-[#495057] text-right">
          {personalInfo.email && <p>Email: {personalInfo.email}</p>}
          {personalInfo.phone && <p>Phone: {personalInfo.phone}</p>}
          {personalInfo.address && <p>Location: {personalInfo.address}</p>}
          {personalInfo.linkedin && <p>LinkedIn: {personalInfo.linkedin}</p>}
          {personalInfo.portfolio && <p>Web: {personalInfo.portfolio}</p>}
        </div>
      </div>

      {/* Summary section */}
      {summary && (
        <div className="mb-6">
          <h2 className="text-[#1a1c1e] font-bold tracking-wide border-b border-[#ced4da] pb-1 mb-2 uppercase">
            SUMMARY
          </h2>
          <p className="text-[#495057]">{summary}</p>
        </div>
      )}

      {/* Experience section */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[#1a1c1e] font-bold tracking-wide border-b border-[#ced4da] pb-1 mb-3 uppercase">
            WORK HISTORY
          </h2>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-[#1a1c1e]">
                    {exp.position} @ {exp.company}
                  </span>
                  <span className="text-[#6c757d] text-[11px]">
                    [{exp.startDate} - {exp.current ? "PRESENT" : exp.endDate.toUpperCase()}]
                  </span>
                </div>
                <p className="text-[#495057] whitespace-pre-line leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects section */}
      {projects && projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[#1a1c1e] font-bold tracking-wide border-b border-[#ced4da] pb-1 mb-3 uppercase">
            RELEVANT PROJECTS
          </h2>
          <div className="space-y-4">
            {projects.map((proj, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-[#1a1c1e]">{proj.title}</span>
                  {proj.technologies && <span className="text-[#495057] font-semibold">[{proj.technologies}]</span>}
                </div>
                <p className="text-[#495057] leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education section */}
      {education && education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[#1a1c1e] font-bold tracking-wide border-b border-[#ced4da] pb-1 mb-3 uppercase">
            EDUCATION
          </h2>
          <div className="space-y-3">
            {education.map((edu, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[#1a1c1e]">{edu.school}</span>
                  <span className="text-[#6c757d] text-[11px]">
                    [{edu.startDate} - {edu.endDate}]
                  </span>
                </div>
                <p className="text-[#495057]">
                  {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                </p>
                {edu.description && <p className="text-[#6c757d] mt-1">{edu.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Extras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills && skills.length > 0 && (
          <div>
            <h2 className="text-[#1a1c1e] font-bold tracking-wide border-b border-[#ced4da] pb-1 mb-2 uppercase">
              TECHNICAL SKILLS
            </h2>
            <p className="text-[#495057] font-medium leading-relaxed">{skills.join(", ")}</p>
          </div>
        )}

        <div className="space-y-4">
          {certifications && certifications.length > 0 && (
            <div>
              <h2 className="text-[#1a1c1e] font-bold tracking-wide border-b border-[#ced4da] pb-1 mb-1 uppercase">
                CERTIFICATIONS
              </h2>
              <ul className="list-disc list-inside text-[#495057] space-y-0.5">
                {certifications.map((cert, idx) => (
                  <li key={idx}>{cert}</li>
                ))}
              </ul>
            </div>
          )}

          {languages && languages.length > 0 && (
            <div>
              <h2 className="text-[#1a1c1e] font-bold tracking-wide border-b border-[#ced4da] pb-1 mb-1 uppercase">
                LANGUAGES
              </h2>
              <p className="text-[#495057]">{languages.join(", ")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CreativeTemplate({ resume }: ResumeTemplateProps) {
  const { personalInfo, summary, education, skills, experience, projects, certifications, languages } = resume;

  return (
    <div className="bg-white text-[#2c3e50] shadow-md rounded-lg overflow-hidden max-w-4xl mx-auto font-sans text-xs flex flex-col md:flex-row">
      {/* Left Sidebar Accent Column */}
      <div className="bg-[#1e293b] text-white p-8 md:w-1/3 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-extrabold uppercase tracking-wide text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-300">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-blue-300 text-[10px] tracking-widest uppercase font-semibold mt-1">Applicant Profile</p>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-slate-300 border-t border-slate-700 pt-4">
          {personalInfo.email && (
            <div>
              <p className="text-slate-400 uppercase text-[9px] font-bold">Email</p>
              <p className="text-[11px] font-medium break-all">{personalInfo.email}</p>
            </div>
          )}
          {personalInfo.phone && (
            <div>
              <p className="text-slate-400 uppercase text-[9px] font-bold">Phone</p>
              <p className="text-[11px] font-medium">{personalInfo.phone}</p>
            </div>
          )}
          {personalInfo.address && (
            <div>
              <p className="text-slate-400 uppercase text-[9px] font-bold">Address</p>
              <p className="text-[11px] font-medium">{personalInfo.address}</p>
            </div>
          )}
          {personalInfo.linkedin && (
            <div>
              <p className="text-slate-400 uppercase text-[9px] font-bold">LinkedIn</p>
              <p className="text-[10px] underline font-medium break-all">{personalInfo.linkedin}</p>
            </div>
          )}
          {personalInfo.portfolio && (
            <div>
              <p className="text-slate-400 uppercase text-[9px] font-bold">Portfolio</p>
              <p className="text-[10px] underline font-medium break-all">{personalInfo.portfolio}</p>
            </div>
          )}
        </div>

        {/* Skills Accent Section */}
        {skills && skills.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-300 font-bold uppercase tracking-wider mb-2">
              Hard & Soft Skills
            </h3>
            <div className="flex flex-wrap gap-1">
              {skills.map((skill, idx) => (
                <span key={idx} className="bg-slate-800 text-blue-200 text-[10px] px-2 py-0.5 rounded font-medium border border-slate-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages Accent Section */}
        {languages && languages.length > 0 && (
          <div className="border-t border-slate-700 pt-4 mt-auto">
            <h3 className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Languages</h3>
            <p className="text-xs text-slate-200">{languages.join(", ")}</p>
          </div>
        )}
      </div>

      {/* Right Core Content Column */}
      <div className="p-8 md:w-2/3 flex flex-col gap-6 bg-slate-50">
        {/* Professional Summary */}
        {summary && (
          <div>
            <h2 className="text-[#0f172a] text-sm font-bold uppercase tracking-wider border-b-2 border-slate-200 pb-1 mb-2">
              Professional Summary
            </h2>
            <p className="text-slate-600 text-xs leading-relaxed font-normal">{summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {experience && experience.length > 0 && (
          <div>
            <h2 className="text-[#0f172a] text-sm font-bold uppercase tracking-wider border-b-2 border-slate-200 pb-1 mb-3">
              Work History
            </h2>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-800">
                      {exp.position} <span className="font-normal text-slate-400">at</span> {exp.company}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] whitespace-pre-line leading-relaxed font-normal">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <div>
            <h2 className="text-[#0f172a] text-sm font-bold uppercase tracking-wider border-b-2 border-slate-200 pb-1 mb-3">
              Key Projects
            </h2>
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-800">{proj.title}</h3>
                    {proj.technologies && (
                      <span className="text-[10px] text-indigo-700 font-semibold uppercase">{proj.technologies}</span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed font-normal">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <div>
            <h2 className="text-[#0f172a] text-sm font-bold uppercase tracking-wider border-b-2 border-slate-200 pb-1 mb-3">
              Education Background
            </h2>
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-slate-800">{edu.school}</h4>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                  <p className="text-slate-500 font-semibold text-[11px]">
                    {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                  </p>
                  {edu.description && <p className="text-slate-400 text-[10px] mt-1">{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications optional inside right body */}
        {certifications && certifications.length > 0 && (
          <div>
            <h2 className="text-[#0f172a] text-sm font-bold uppercase tracking-wider border-b-2 border-slate-200 pb-1 mb-2">
              Credentials & Accreditations
            </h2>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
              {certifications.map((cert, idx) => (
                <li key={idx} className="font-normal">{cert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function TemplateRender({ resume }: ResumeTemplateProps) {
  switch (resume.templateId) {
    case "minimal":
      return <MinimalTemplate resume={resume} />;
    case "creative":
      return <CreativeTemplate resume={resume} />;
    case "modern":
    default:
      return <ModernTemplate resume={resume} />;
  }
}
