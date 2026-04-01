"""
PDF Report Generator
Generate professional plagiarism reports in PDF format
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from datetime import datetime
import os
import traceback


class ReportGenerator:
    """Generate PDF reports for plagiarism analysis"""

    @staticmethod
    def generate_plagiarism_report(deliverable, analysis_result, supervisor):
        """
        Generate PDF report for plagiarism check

        Args:
            deliverable: Deliverable model instance
            analysis_result: Dictionary with analysis results
            supervisor: User model instance (supervisor)

        Returns:
            str: Generated filename
        """
        print(f"[Report] Generating PDF report for deliverable #{deliverable.id}")

        try:
            # Create filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"plagiarism_report_{deliverable.id}_{timestamp}.pdf"
            reports_dir = os.path.join('uploads', 'reports')
            filepath = os.path.join(reports_dir, filename)

            # Ensure reports directory exists
            os.makedirs(reports_dir, exist_ok=True)
            print(f"[Report] Saving to: {filepath}")

            # Create PDF
            doc = SimpleDocTemplate(filepath, pagesize=letter)
            story = []
            styles = getSampleStyleSheet()

            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1e40af'),
                spaceAfter=30,
                alignment=TA_CENTER
            )

            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=16,
                textColor=colors.HexColor('#1e40af'),
                spaceAfter=12,
                spaceBefore=12
            )

            # Title
            story.append(Paragraph("AI Content Detection Report", title_style))
            story.append(Spacer(1, 0.2*inch))

            # Metadata section
            story.append(Paragraph("<b>Report Information</b>", heading_style))

            metadata_data = [
                ['Deliverable:', deliverable.title],
                ['Project:', deliverable.project.title if deliverable.project else 'N/A'],
                ['Student:', deliverable.submitter.name if deliverable.submitter else 'N/A'],
                ['Checked By:', supervisor.name],
                ['Date Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
                ['Report ID:', str(analysis_result.get('report_id', 'N/A'))]
            ]

            metadata_table = Table(metadata_data, colWidths=[2*inch, 4*inch])
            metadata_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            story.append(metadata_table)
            story.append(Spacer(1, 0.3*inch))

            # Overall Score section
            ai_score = analysis_result.get('ai_score', 0)
            classification = analysis_result.get('classification', 'Unknown')
            confidence = analysis_result.get('confidence', 0)

            story.append(Paragraph("<b>Overall AI Content Score</b>", heading_style))

            # Determine color based on score
            if ai_score < 30:
                score_color = colors.green
                score_bg = colors.HexColor('#d1fae5')
            elif ai_score < 70:
                score_color = colors.orange
                score_bg = colors.HexColor('#fef3c7')
            else:
                score_color = colors.red
                score_bg = colors.HexColor('#fee2e2')

            score_data = [
                ['AI Score', 'Classification', 'Confidence'],
                [f"{ai_score}%", classification, f"{confidence}%"]
            ]

            score_table = Table(score_data, colWidths=[2*inch, 2.5*inch, 1.5*inch])
            score_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 0), (-1, 0), 12),
                ('FONTSIZE', (0, 1), (-1, -1), 14),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), score_bg),
                ('TEXTCOLOR', (0, 1), (0, 1), score_color),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 15),
                ('TOPPADDING', (0, 1), (-1, -1), 15)
            ]))
            story.append(score_table)
            story.append(Spacer(1, 0.3*inch))

            # Interpretation section
            story.append(Paragraph("<b>Interpretation</b>", heading_style))

            if ai_score < 30:
                interpretation = (
                    "The content appears to be <b>primarily human-written</b> with minimal AI assistance. "
                    "The low AI score suggests authentic student work with natural writing patterns."
                )
            elif ai_score < 70:
                interpretation = (
                    "The content shows <b>mixed characteristics</b>. Some sections may contain AI-generated text "
                    "or AI-assisted writing. Manual review is recommended to verify authorship."
                )
            else:
                interpretation = (
                    "<font color='red'><b>High AI Content Detected</b></font><br/>"
                    "The content shows strong indicators of AI-generation. This suggests significant use of "
                    "AI writing tools. Manual review and student consultation are strongly recommended."
                )

            story.append(Paragraph(interpretation, styles['Normal']))
            story.append(Spacer(1, 0.3*inch))

            # Document statistics
            story.append(Paragraph("<b>Document Statistics</b>", heading_style))

            stats_data = [
                ['Total Characters:', str(analysis_result.get('text_length', 0))],
                ['Total Words:', str(analysis_result.get('word_count', 0))],
                ['Text Chunks Analyzed:', str(analysis_result.get('total_chunks', 0))],
                ['Average AI Score per Chunk:', f"{ai_score}%"]
            ]

            stats_table = Table(stats_data, colWidths=[2.5*inch, 3.5*inch])
            stats_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            story.append(stats_table)
            story.append(Spacer(1, 0.3*inch))

            # Chunk scores visualization (if available)
            chunk_scores = analysis_result.get('chunk_scores', [])
            if chunk_scores:
                story.append(Paragraph("<b>Chunk-by-Chunk Analysis</b>", heading_style))

                chunk_data = [['Chunk #', 'AI Score (%)']]

                for i, score in enumerate(chunk_scores[:10], 1):
                    chunk_data.append([f"Chunk {i}", f"{score}%"])

                if len(chunk_scores) > 10:
                    chunk_data.append(['...', f"({len(chunk_scores) - 10} more chunks)"])

                chunk_table = Table(chunk_data, colWidths=[1.5*inch, 4.5*inch])
                chunk_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6b7280')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                    ('ALIGN', (1, 1), (1, -1), 'LEFT'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
                ]))
                story.append(chunk_table)
                story.append(Spacer(1, 0.3*inch))

            # Recommendations section
            story.append(Paragraph("<b>Recommendations</b>", heading_style))

            recommendations = []
            if ai_score < 30:
                recommendations.append("Content appears authentic. No immediate action required.")
                recommendations.append("Consider this as baseline for future submissions.")
            elif ai_score < 70:
                recommendations.append("Schedule 1-on-1 meeting with student to discuss writing process.")
                recommendations.append("Request student to explain specific sections in their own words.")
                recommendations.append("Consider requesting revision with emphasis on original thought.")
            else:
                recommendations.append("<b>Immediate consultation with student required.</b>")
                recommendations.append("Request detailed explanation of research and writing methodology.")
                recommendations.append("Review academic integrity policies with student.")
                recommendations.append("Consider requesting complete resubmission with monitored writing sessions.")

            for rec in recommendations:
                story.append(Paragraph(f"* {rec}", styles['Normal']))
                story.append(Spacer(1, 0.1*inch))

            story.append(Spacer(1, 0.4*inch))

            # Similarity Check Results (if available)
            similar_projects = analysis_result.get('similar_projects', [])
            if similar_projects:
                story.append(Paragraph("<b>Similarity Check Results</b>", heading_style))
                
                similarity_text = (
                    f"This proposal was compared against {len(similar_projects)} previous projects. "
                    "The following are the most similar submissions:"
                )
                story.append(Paragraph(similarity_text, styles['Normal']))
                story.append(Spacer(1, 0.15*inch))
                
                # Top similar projects table
                sim_data = [['Project Title', 'Similarity Score', 'Key Matches']]
                for proj in similar_projects[:5]:
                    # Build evidence summary
                    evidence_list = proj.get('matched_evidence', [])
                    if evidence_list:
                        evidence_summary = "; ".join([
                            f"{m.get('similarity', 0)}% match" for m in evidence_list[:2]
                        ])
                    else:
                        evidence_summary = "No detailed matches"
                    
                    sim_data.append([
                        proj.get('title', 'N/A')[:50],
                        f"{proj.get('similarity_score', 0)}%",
                        evidence_summary
                    ])
                
                sim_table = Table(sim_data, colWidths=[2*inch, 1.5*inch, 2.5*inch])
                sim_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('TOPPADDING', (0, 0), (-1, 0), 8),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')])
                ]))
                story.append(sim_table)
                story.append(Spacer(1, 0.2*inch))
                
                # Detailed evidence snippets (if available)
                for i, proj in enumerate(similar_projects[:3], 1):
                    evidence = proj.get('matched_evidence', [])
                    if evidence:
                        story.append(Paragraph(f"<b>Project {i} - Matched Sentences</b>", styles['Heading3']))
                        for j, match in enumerate(evidence[:2], 1):
                            match_text = (
                                f"<i>Target Sentence:</i> \"{match.get('target', '')[:100]}...<br/>"
                                f"<i>Matched with:</i> \"{match.get('matched', '')[:100]}...<br/>"
                                f"<i>Similarity:</i> {match.get('similarity', 0)}%"
                            )
                            story.append(Paragraph(match_text, styles['Normal']))
                            story.append(Spacer(1, 0.1*inch))
                
                story.append(Spacer(1, 0.2*inch))

            # Disclaimer
            story.append(Paragraph("<b>Important Disclaimer</b>", heading_style))
            disclaimer = (
                "<i>This report is generated using AI detection models (roberta-base-openai-detector) and "
                "should be used as a <b>guide, not definitive proof</b> of AI usage. "
                "AI detection technology has limitations and may produce false positives/negatives. "
                "Manual review by subject matter experts and direct conversation with students are "
                "recommended for final assessment. This report should be one factor among many in "
                "evaluating student work.</i>"
            )
            story.append(Paragraph(disclaimer, styles['Normal']))

            # Footer
            story.append(Spacer(1, 0.3*inch))
            footer_text = "<i>Generated by FYP Management System - AI Content Detection Module</i>"
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=8,
                textColor=colors.grey,
                alignment=TA_CENTER
            )
            story.append(Paragraph(footer_text, footer_style))

            # Build PDF
            doc.build(story)

            print(f"[Report] PDF report generated: {filename}")
            return filename

        except Exception as e:
            print(f"[Report] ERROR generating PDF: {e}")
            print(f"[Report] Traceback:\n{traceback.format_exc()}")
            raise
